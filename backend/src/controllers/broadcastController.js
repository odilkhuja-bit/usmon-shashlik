// ============================================
// USMON SHASHLIK — Broadcast Controller (Admin)
// ============================================

const { PrismaClient } = require('@prisma/client');
const { startBroadcast } = require('../services/broadcastService');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Create and start broadcast
 */
async function create(req, res, next) {
  try {
    const { title, message, imageUrl, buttonText, buttonUrl, targetFilter } = req.body;

    // Count target users for preview
    let userFilter = { isBlocked: false };
    if (targetFilter) {
      try {
        const filter = JSON.parse(targetFilter);
        if (filter.type === 'active') {
          const activeIds = await prisma.order.findMany({
            select: { userId: true }, distinct: ['userId'],
          });
          userFilter.id = { in: activeIds.map((u) => u.userId) };
        } else if (filter.type === 'branch' && filter.branchId) {
          userFilter.selectedBranchId = filter.branchId;
        }
      } catch (e) { /* use default filter */ }
    }

    const totalUsers = await prisma.user.count({ where: userFilter });

    const broadcast = await prisma.broadcast.create({
      data: {
        title,
        message,
        imageUrl: imageUrl || null,
        buttonText: buttonText || null,
        buttonUrl: buttonUrl || null,
        targetFilter: targetFilter || null,
        totalUsers,
        status: 'PENDING',
      },
    });

    logger.info('Broadcast created', { id: broadcast.id, title, totalUsers });

    // Start sending in background
    const io = req.app.get('io');
    setImmediate(() => startBroadcast(broadcast.id, io));

    res.status(201).json(broadcast);
  } catch (error) {
    next(error);
  }
}

/**
 * Get broadcast count preview
 */
async function getTargetCount(req, res, next) {
  try {
    const { targetFilter } = req.query;
    let userFilter = { isBlocked: false };

    if (targetFilter) {
      try {
        const filter = JSON.parse(targetFilter);
        if (filter.type === 'active') {
          const ids = await prisma.order.findMany({ select: { userId: true }, distinct: ['userId'] });
          userFilter.id = { in: ids.map((u) => u.userId) };
        } else if (filter.type === 'recent30') {
          const ago = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          const ids = await prisma.order.findMany({
            where: { createdAt: { gte: ago } }, select: { userId: true }, distinct: ['userId'],
          });
          userFilter.id = { in: ids.map((u) => u.userId) };
        } else if (filter.type === 'branch' && filter.branchId) {
          userFilter.selectedBranchId = parseInt(filter.branchId);
        } else if (filter.type === 'inactive') {
          const ids = await prisma.order.findMany({ select: { userId: true }, distinct: ['userId'] });
          userFilter.id = { notIn: ids.map((u) => u.userId) };
        }
      } catch (e) { /* use default */ }
    }

    const count = await prisma.user.count({ where: userFilter });
    res.json({ count });
  } catch (error) {
    next(error);
  }
}

/**
 * Get broadcast history
 */
async function getHistory(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [broadcasts, total] = await Promise.all([
      prisma.broadcast.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.broadcast.count(),
    ]);

    res.json({
      broadcasts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single broadcast detail
 */
async function getOne(req, res, next) {
  try {
    const broadcast = await prisma.broadcast.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        logs: {
          take: 100,
          orderBy: { sentAt: 'desc' },
          include: {
            user: { select: { firstName: true, username: true, telegramId: true } },
          },
        },
      },
    });

    if (!broadcast) return res.status(404).json({ error: 'Broadcast not found' });

    // Serialize BigInt
    const serialized = {
      ...broadcast,
      logs: broadcast.logs.map((l) => ({
        ...l,
        user: l.user ? { ...l.user, telegramId: l.user.telegramId.toString() } : null,
      })),
    };

    res.json(serialized);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create,
  getTargetCount,
  getHistory,
  getOne,
};
