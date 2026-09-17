// ============================================
// USMON SHASHLIK — Admin Auth Middleware
// ============================================

const jwt = require('jsonwebtoken');
const config = require('../config/default');

/**
 * Middleware: Verify admin JWT token
 */
function adminAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    if (!decoded.adminId || !decoded.role) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.admin = {
      id: decoded.adminId,
      role: decoded.role,
      username: decoded.username,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Middleware: Check admin role
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

module.exports = { adminAuth, requireRole };
