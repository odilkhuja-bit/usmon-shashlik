// ============================================
// USMON SHASHLIK — User Controller (Admin)
// ============================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get all users (admin)
 */
async function getAll(req, res, next) {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          selectedBranch: { select: { name: true } },
          _count: { select: { orders: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Calculate total spent per user
    const userIds = users.map((u) => u.id);
    const totals = await prisma.order.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds }, status: { not: 'CANCELLED' } },
      _sum: { total: true },
    });

    const totalMap = {};
    totals.forEach((t) => (totalMap[t.userId] = t._sum.total || 0));

    // Get last order date per user
    const lastOrders = await prisma.order.findMany({
      where: { userId: { in: userIds } },
      orderBy: { createdAt: 'desc' },
      distinct: ['userId'],
      select: { userId: true, createdAt: true },
    });

    const lastOrderMap = {};
    lastOrders.forEach((o) => (lastOrderMap[o.userId] = o.createdAt));

    const serialized = users.map((u) => ({
      id: u.id,
      telegramId: u.telegramId.toString(),
      firstName: u.firstName,
      lastName: u.lastName,
      username: u.username,
      phone: u.phone,
      language: u.language,
      selectedBranch: u.selectedBranch?.name || null,
      orderCount: u._count.orders,
      totalSpent: totalMap[u.id] || 0,
      lastOrder: lastOrderMap[u.id] || null,
      isBlocked: u.isBlocked,
      createdAt: u.createdAt,
    }));

    res.json({
      users: serialized,
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
 * Get single user (admin)
 */
async function getOne(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        selectedBranch: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { branch: { select: { name: true } } },
        },
        _count: { select: { orders: true } },
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const totalSpent = await prisma.order.aggregate({
      where: { userId: user.id, status: { not: 'CANCELLED' } },
      _sum: { total: true },
    });

    res.json({
      ...user,
      telegramId: user.telegramId.toString(),
      totalSpent: totalSpent._sum.total || 0,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Block/unblock user
 */
async function toggleBlock(req, res, next) {
  try {
    const userId = parseInt(req.params.id);
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isBlocked: !user.isBlocked },
    });

    res.json({
      id: updated.id,
      isBlocked: updated.isBlocked,
      message: updated.isBlocked ? 'User blocked' : 'User unblocked',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Export users CSV (admin)
 */
async function exportUsersCsv(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      include: {
        selectedBranch: { select: { name: true } },
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const header = 'ID,Telegram ID,Name,Username,Phone,Branch,Orders,Registered,Status\n';
    const rows = users.map((u) => {
      const name = [u.firstName, u.lastName].filter(Boolean).join(' ');
      const date = new Date(u.createdAt).toISOString().split('T')[0];
      return `${u.id},${u.telegramId.toString()},"${name}",${u.username || ''},${u.phone || ''},"${u.selectedBranch?.name || ''}",${u._count.orders},${date},${u.isBlocked ? 'Blocked' : 'Active'}`;
    });

    const csv = header + rows.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    res.send('\uFEFF' + csv);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAll,
  getOne,
  toggleBlock,
  exportUsersCsv,
};
