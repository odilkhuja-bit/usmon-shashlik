// ============================================
// USMON SHASHLIK — Admin Controller
// ============================================

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/default');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Admin login
 */
async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const admin = await prisma.admin.findUnique({ where: { username } });

    if (!admin || !admin.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { adminId: admin.id, role: admin.role, username: admin.username },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    logger.info('Admin login', { username: admin.username, role: admin.role });

    res.json({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current admin profile
 */
async function getMe(req, res, next) {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.admin.id },
      select: { id: true, username: true, name: true, role: true, createdAt: true },
    });

    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    res.json(admin);
  } catch (error) {
    next(error);
  }
}

/**
 * Change password
 */
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const admin = await prisma.admin.findUnique({ where: { id: req.admin.id } });
    const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.admin.update({
      where: { id: req.admin.id },
      data: { passwordHash },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all admins (SUPER_ADMIN only)
 */
async function getAdmins(req, res, next) {
  try {
    const admins = await prisma.admin.findMany({
      select: { id: true, username: true, name: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    res.json(admins);
  } catch (error) {
    next(error);
  }
}

/**
 * Create admin (SUPER_ADMIN only)
 */
async function createAdmin(req, res, next) {
  try {
    const { username, password, name, role } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Username, password, and name are required' });
    }

    const validRoles = ['ADMIN', 'OPERATOR'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const existing = await prisma.admin.findUnique({ where: { username } });
    if (existing) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await prisma.admin.create({
      data: {
        username,
        passwordHash,
        name,
        role: role || 'OPERATOR',
      },
      select: { id: true, username: true, name: true, role: true, createdAt: true },
    });

    logger.info('Admin created', { username, role: admin.role });

    res.status(201).json(admin);
  } catch (error) {
    next(error);
  }
}

/**
 * Update admin (SUPER_ADMIN only)
 */
async function updateAdmin(req, res, next) {
  try {
    const { name, role, isActive, password } = req.body;
    const adminId = parseInt(req.params.id);

    const updateData = {};
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) updateData.passwordHash = await bcrypt.hash(password, 12);

    const admin = await prisma.admin.update({
      where: { id: adminId },
      data: updateData,
      select: { id: true, username: true, name: true, role: true, isActive: true },
    });

    res.json(admin);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete admin (SUPER_ADMIN only)
 */
async function deleteAdmin(req, res, next) {
  try {
    const adminId = parseInt(req.params.id);

    if (adminId === req.admin.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    await prisma.admin.delete({ where: { id: adminId } });
    res.json({ message: 'Admin deleted' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  getMe,
  changePassword,
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
};
