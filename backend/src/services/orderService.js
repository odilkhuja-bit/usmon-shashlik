// ============================================
// USMON SHASHLIK — Order Service
// ============================================

const { PrismaClient } = require('@prisma/client');
const { generateOrderNumber } = require('../utils/helpers');
const { sendOrderNotification, sendStatusNotification } = require('./notificationService');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Create a new order
 */
async function createOrder(userId, orderData, io) {
  const { items, branchId, deliveryType, address, latitude, longitude, comment, phone } = orderData;

  // Fetch products to calculate real prices (prevent price manipulation)
  const productIds = items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isDeleted: false, isAvailable: true },
  });

  if (products.length !== productIds.length) {
    throw Object.assign(new Error('Some products are not available'), { statusCode: 400 });
  }

  // Build order items snapshot
  const orderItems = items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) throw Object.assign(new Error(`Product ${item.productId} not found`), { statusCode: 400 });

    return {
      productId: product.id,
      name: product.nameUz,
      nameRu: product.nameRu,
      quantity: item.quantity,
      price: product.price,
      total: product.price * item.quantity,
    };
  });

  const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);

  // Get delivery price from settings
  const deliverySettingRaw = await prisma.setting.findUnique({ where: { key: 'delivery_price' } });
  const deliveryPrice = deliveryType === 'DELIVERY' ? parseInt(deliverySettingRaw?.value || '20000') : 0;
  const total = subtotal + deliveryPrice;

  // Check minimum order
  const minOrderRaw = await prisma.setting.findUnique({ where: { key: 'minimum_order' } });
  const minimumOrder = parseInt(minOrderRaw?.value || '0');
  if (minimumOrder > 0 && subtotal < minimumOrder) {
    throw Object.assign(
      new Error(`Minimum order amount is ${minimumOrder}. Current: ${subtotal}`),
      { statusCode: 400 }
    );
  }

  const tempOrderNumber = generateOrderNumber();

  let order = await prisma.order.create({
    data: {
      orderNumber: tempOrderNumber,
      userId,
      branchId,
      items: orderItems,
      subtotal,
      deliveryPrice,
      total,
      deliveryType,
      address: address || null,
      latitude: latitude || null,
      longitude: longitude || null,
      comment: comment || null,
      phone,
      status: 'NEW',
    },
    include: {
      user: true,
      branch: true,
    },
  });

  const realOrderNumber = `USM-${String(order.id).padStart(4, '0')}`;
  
  order = await prisma.order.update({
    where: { id: order.id },
    data: { orderNumber: realOrderNumber },
    include: { user: true, branch: true }
  });

  logger.info('Order created', { orderNumber: order.orderNumber, userId, total });

  // Send Telegram notification to user
  try {
    await sendOrderNotification(order.user, order, order.branch);
  } catch (err) {
    logger.error('Failed to send order notification:', err.message);
  }

  // Emit real-time event to admin
  if (io) {
    io.to('admins').emit('new-order', {
      id: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
      user: {
        firstName: order.user.firstName,
        phone: order.phone,
      },
      branch: {
        name: order.branch.name,
      },
    });
  }

  return order;
}

/**
 * Update order status
 */
async function updateOrderStatus(orderId, newStatus, io) {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus },
    include: { user: true, branch: true },
  });

  logger.info('Order status changed', {
    orderNumber: order.orderNumber,
    status: newStatus,
  });

  // Send Telegram notification
  try {
    await sendStatusNotification(order.user, order);
  } catch (err) {
    logger.error('Failed to send status notification:', err.message);
  }

  // Emit real-time event
  if (io) {
    io.to('admins').emit('order-updated', {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
    });
  }

  return order;
}

module.exports = {
  createOrder,
  updateOrderStatus,
};
