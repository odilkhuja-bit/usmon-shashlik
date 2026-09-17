// ============================================
// USMON SHASHLIK — Main Server
// ============================================

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const config = require('./config/default');
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middlewares/error.middleware');
const { initBot } = require('./core/bot');

// Routes
const clientRoutes = require('./routes/client.routes');
const orderRoutes = require('./routes/order.routes');
const adminRoutes = require('./routes/admin.routes');

// ─── Express Setup ──────────────────────────
const app = express();
const server = http.createServer(app);

// ─── Socket.IO ──────────────────────────────
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

// Store io instance for use in routes
app.set('io', io);

// Socket.IO admin namespace
io.on('connection', (socket) => {
  logger.info('Socket connected', { id: socket.id });

  socket.on('join-admin', () => {
    socket.join('admins');
    logger.info('Admin joined real-time channel', { id: socket.id });
  });

  socket.on('disconnect', () => {
    logger.info('Socket disconnected', { id: socket.id });
  });
});

// ─── Middleware ──────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// ─── BigInt JSON serialization ──────────────
// Express can't serialize BigInt by default
const originalJson = express.response.json;
express.response.json = function (obj) {
  return originalJson.call(this, JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  ));
};

// ─── API Routes ─────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'usmon-shashlik-api', timestamp: new Date().toISOString() });
});

app.use('/api/client', clientRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// ─── Production: Serve Static Files ─────────
const isProduction = config.nodeEnv === 'production';

if (isProduction) {
  const publicDir = path.join(__dirname, '..', 'public');

  // Serve Admin Panel at /admin
  const adminDir = path.join(publicDir, 'admin');
  app.use('/admin', express.static(adminDir));
  app.get('/admin/*', (_req, res) => {
    res.sendFile(path.join(adminDir, 'index.html'));
  });

  // Serve Client Mini App at / (must be last)
  const clientDir = path.join(publicDir, 'client');
  app.use(express.static(clientDir));
  app.get('*', (req, res, next) => {
    // Don't serve HTML for API routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/')) {
      return next();
    }
    res.sendFile(path.join(clientDir, 'index.html'));
  });
} else {
  // ─── Development: Error Handling ────────────
  app.use(notFound);
  app.use(errorHandler);
}

// ─── Start Server ───────────────────────────
const PORT = config.port;

server.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📋 API: http://localhost:${PORT}/api/health`);
  logger.info(`🌍 Environment: ${config.nodeEnv}`);

  if (isProduction) {
    logger.info(`🍢 Client: http://localhost:${PORT}/`);
    logger.info(`📊 Admin: http://localhost:${PORT}/admin`);
  }

  // Initialize Telegram Bot
  initBot();
});

module.exports = { app, server, io };
