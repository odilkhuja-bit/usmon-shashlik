// ============================================
// USMON SHASHLIK — Order Controller
// ============================================

const { PrismaClient } = require('@prisma/client');
const { createOrder, updateOrderStatus } = require('../services/orderService');

const prisma = new PrismaClient();

/**
 * Create a new order (client)
 */
async function create(req, res, next) {
  try {
    const io = req.app.get('io');
    const order = await createOrder(req.user.id, req.body, io);

    res.status(201).json({
      id: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user's orders (client)
 */
async function getUserOrders(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: { branch: true },
      }),
      prisma.order.count({ where: { userId: req.user.id } }),
    ]);

    res.json({
      orders,
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
 * Get single order detail (client)
 */
async function getOrderDetail(req, res, next) {
  try {
    const order = await prisma.order.findFirst({
      where: { id: parseInt(req.params.id), userId: req.user.id },
      include: { branch: true },
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json(order);
  } catch (error) {
    next(error);
  }
}

// ─── Admin Order Endpoints ──────────────────

/**
 * Get all orders (admin)
 */
async function adminGetOrders(req, res, next) {
  try {
    const { page = 1, limit = 20, status, branchId, search, dateFrom, dateTo } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (branchId) where.branchId = parseInt(branchId);
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, phone: true, telegramId: true },
          },
          branch: { select: { id: true, name: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    // Serialize BigInt
    const serialized = orders.map((o) => ({
      ...o,
      user: o.user
        ? { ...o.user, telegramId: o.user.telegramId.toString() }
        : null,
    }));

    res.json({
      orders: serialized,
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
 * Get single order (admin)
 */
async function adminGetOrder(req, res, next) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        user: true,
        branch: true,
      },
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json({
      ...order,
      user: order.user
        ? { ...order.user, telegramId: order.user.telegramId.toString() }
        : null,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update order status (admin)
 */
async function adminUpdateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const validStatuses = ['NEW', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERING', 'COMPLETED', 'CANCELLED'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const io = req.app.get('io');
    const order = await updateOrderStatus(parseInt(req.params.id), status, io);

    res.json({
      ...order,
      user: order.user
        ? { ...order.user, telegramId: order.user.telegramId.toString() }
        : null,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Export orders as CSV (admin)
 */
async function exportOrdersCsv(req, res, next) {
  try {
    const { dateFrom, dateTo } = req.query;
    const where = {};

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, phone: true } },
        branch: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const header = 'Order Number,Date,Customer,Phone,Branch,Items,Subtotal,Delivery,Total,Type,Status\n';
    const rows = orders.map((o) => {
      const items = Array.isArray(o.items) ? o.items.map((i) => `${i.name}x${i.quantity}`).join('; ') : '';
      const date = new Date(o.createdAt).toISOString().split('T')[0];
      const name = [o.user?.firstName, o.user?.lastName].filter(Boolean).join(' ');
      return `${o.orderNumber},${date},"${name}",${o.phone || ''},"${o.branch?.name || ''}","${items}",${o.subtotal},${o.deliveryPrice},${o.total},${o.deliveryType},${o.status}`;
    });

    const csv = header + rows.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
    res.send('\uFEFF' + csv);
  } catch (error) {
    next(error);
  }
}

/**
 * Update order items (admin edit)
 */
async function adminUpdateOrderItems(req, res, next) {
  try {
    const { items, deliveryPrice } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items cannot be empty' });
    }

    const orderId = parseInt(req.params.id);
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    let subtotal = 0;
    for (const item of items) {
      subtotal += item.price * item.quantity;
    }
    
    const finalDeliveryPrice = deliveryPrice !== undefined ? deliveryPrice : order.deliveryPrice;
    const total = subtotal + finalDeliveryPrice;

    const { PrismaClient } = require('@prisma/client');
    const prismaLocal = new PrismaClient();
    
    const updatedOrder = await prismaLocal.order.update({
      where: { id: orderId },
      data: {
        items,
        subtotal,
        deliveryPrice: finalDeliveryPrice,
        total,
      },
      include: {
        user: true,
        branch: true
      }
    });

    const { sendMessage } = require('./../services/telegramService');
    const { formatPrice } = require('./../utils/helpers');
    const lang = updatedOrder.user.language || 'uz';
    const msg = lang === 'ru' 
      ? `⚠️ Ваш заказ <b>#${updatedOrder.orderNumber}</b> был изменён администратором.\n\nНовая сумма: <b>${formatPrice(total)} сум</b>.`
      : `⚠️ Sizning <b>#${updatedOrder.orderNumber}</b> buyurtmangiz admin tomonidan tahrirlandi.\n\nYangi summa: <b>${formatPrice(total)} so'm</b>.`;
    
    await sendMessage(updatedOrder.user.telegramId.toString(), msg);

    res.json({
      ...updatedOrder,
      user: updatedOrder.user ? { ...updatedOrder.user, telegramId: updatedOrder.user.telegramId.toString() } : null
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create,
  getUserOrders,
  getOrderDetail,
  adminGetOrders,
  adminGetOrder,
  adminUpdateStatus,
  adminUpdateOrderItems,
  exportOrdersCsv,
};
