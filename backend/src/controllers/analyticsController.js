// ============================================
// USMON SHASHLIK — Analytics Controller (Admin)
// ============================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get dashboard stats
 */
async function getDashboard(req, res, next) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      todayOrders,
      todayRevenue,
      totalUsers,
      newOrders,
      preparingOrders,
      deliveringOrders,
      totalOrders,
    ] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.aggregate({
        where: { createdAt: { gte: today }, status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),
      prisma.user.count(),
      prisma.order.count({ where: { status: 'NEW' } }),
      prisma.order.count({ where: { status: 'PREPARING' } }),
      prisma.order.count({ where: { status: 'DELIVERING' } }),
      prisma.order.count(),
    ]);

    res.json({
      todayOrders,
      todayRevenue: todayRevenue._sum.total || 0,
      totalUsers,
      newOrders,
      preparingOrders,
      deliveringOrders,
      totalOrders,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get revenue chart data (last 30 days)
 */
async function getRevenueChart(req, res, next) {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { not: 'CANCELLED' },
      },
      select: { total: true, createdAt: true },
    });

    // Group by date
    const dailyRevenue = {};
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const key = date.toISOString().split('T')[0];
      dailyRevenue[key] = 0;
    }

    orders.forEach((o) => {
      const key = new Date(o.createdAt).toISOString().split('T')[0];
      if (dailyRevenue[key] !== undefined) {
        dailyRevenue[key] += o.total;
      }
    });

    const data = Object.entries(dailyRevenue).map(([date, revenue]) => ({ date, revenue }));

    res.json(data);
  } catch (error) {
    next(error);
  }
}

/**
 * Get popular products
 */
async function getPopularProducts(req, res, next) {
  try {
    const { limit = 10 } = req.query;

    const orders = await prisma.order.findMany({
      where: { status: { not: 'CANCELLED' } },
      select: { items: true },
    });

    // Count product popularity
    const productCount = {};
    orders.forEach((order) => {
      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          const key = item.name || item.nameUz || `Product ${item.productId}`;
          productCount[key] = (productCount[key] || 0) + item.quantity;
        });
      }
    });

    const sorted = Object.entries(productCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, parseInt(limit))
      .map(([name, count]) => ({ name, count }));

    res.json(sorted);
  } catch (error) {
    next(error);
  }
}

/**
 * Get branch performance
 */
async function getBranchStats(req, res, next) {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        _count: { select: { orders: true, users: true } },
      },
    });

    const branchStats = await Promise.all(
      branches.map(async (branch) => {
        const revenue = await prisma.order.aggregate({
          where: { branchId: branch.id, status: { not: 'CANCELLED' } },
          _sum: { total: true },
        });

        return {
          id: branch.id,
          name: branch.name,
          orders: branch._count.orders,
          users: branch._count.users,
          revenue: revenue._sum.total || 0,
        };
      })
    );

    res.json(branchStats);
  } catch (error) {
    next(error);
  }
}

/**
 * Get full analytics
 */
async function getAnalytics(req, res, next) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      monthlyRevenue,
      weeklyRevenue,
      totalRevenue,
      totalOrders,
      avgOrderValue,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { createdAt: { gte: thirtyDaysAgo }, status: { not: 'CANCELLED' } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: sevenDaysAgo }, status: { not: 'CANCELLED' } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: { status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),
      prisma.order.count({ where: { status: { not: 'CANCELLED' } } }),
      prisma.order.aggregate({
        where: { status: { not: 'CANCELLED' } },
        _avg: { total: true },
      }),
    ]);

    res.json({
      monthlyRevenue: monthlyRevenue._sum.total || 0,
      monthlyOrders: monthlyRevenue._count,
      weeklyRevenue: weeklyRevenue._sum.total || 0,
      weeklyOrders: weeklyRevenue._count,
      totalRevenue: totalRevenue._sum.total || 0,
      totalOrders,
      avgOrderValue: Math.round(avgOrderValue._avg.total || 0),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboard,
  getRevenueChart,
  getPopularProducts,
  getBranchStats,
  getAnalytics,
};
