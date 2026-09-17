require('dotenv').config();

const config = {
  port: parseInt(process.env.BACKEND_PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  adminUrl: process.env.ADMIN_URL || 'http://localhost:3001',
  ngrokUrl: process.env.NGROK_URL || '',
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: '7d',
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  },
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
  delivery: {
    defaultPrice: 20000,
    minimumOrder: 50000,
  },
  broadcast: {
    batchSize: 25,
    delayMs: 1100,
  },
};

module.exports = config;
