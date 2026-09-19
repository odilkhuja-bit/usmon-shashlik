// ============================================
// USMON SHASHLIK — Notification Service
// ============================================

const { sendMessage } = require('./telegramService');
const { formatPrice, orderStatusLabels, deliveryTypeLabels } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Send order confirmation notification to user
 */
async function sendOrderNotification(user, order, branch) {
  const lang = user.language || 'uz';

  const itemsList = order.items
    .map((item) => `  • ${item.name} × ${item.quantity}`)
    .join('\n');

  const messages = {
    uz: `✅ <b>Buyurtma qabul qilindi!</b>\n\n📋 Buyurtma: <b>#${order.orderNumber}</b>\n📍 Filial: ${branch.name}\n${deliveryTypeLabels[order.deliveryType]?.uz || order.deliveryType}\n\n🍢 <b>Taomlar:</b>\n${itemsList}\n\n💰 <b>Jami: ${formatPrice(order.total)} so'm</b>\n\nTez orada siz bilan bog'lanamiz! 🍢`,

    ru: `✅ <b>Заказ принят!</b>\n\n📋 Заказ: <b>#${order.orderNumber}</b>\n📍 Филиал: ${branch.nameRu || branch.name}\n${deliveryTypeLabels[order.deliveryType]?.ru || order.deliveryType}\n\n🍢 <b>Блюда:</b>\n${itemsList}\n\n💰 <b>Итого: ${formatPrice(order.total)} сум</b>\n\nСкоро свяжемся с вами! 🍢`,
  };

  const result = await sendMessage(user.telegramId.toString(), messages[lang] || messages.uz);

  if (result) {
    logger.info(`Order notification sent to user ${user.telegramId}`, { orderNumber: order.orderNumber });
  }

  return result;
}

/**
 * Send order status change notification to user
 */
async function sendStatusNotification(user, order) {
  const lang = user.language || 'uz';
  const statusLabel = orderStatusLabels[order.status];

  const statusEmojis = {
    CONFIRMED: '✅',
    PREPARING: '🍳',
    READY: '✨',
    DELIVERING: '🚚',
    COMPLETED: '🎉',
    CANCELLED: '❌',
  };

  const emoji = statusEmojis[order.status] || '📋';

  const messages = {
    uz: {
      CONFIRMED: `${emoji} Buyurtma <b>#${order.orderNumber}</b> tasdiqlandi!\n\nTez orada tayyorlashni boshlaymiz.`,
      PREPARING: `${emoji} Buyurtma <b>#${order.orderNumber}</b> tayyorlanmoqda!\n\nBiroz kuting, mazali taomlar tayyorlanmoqda.`,
      READY: `${emoji} Buyurtma <b>#${order.orderNumber}</b> tayyor!\n\nSizning buyurtmangiz tayyor.`,
      DELIVERING: `${emoji} Buyurtma <b>#${order.orderNumber}</b> yo'lda!\n\nKuryerimiz buyurtmangizni yetkazmoqda.`,
      COMPLETED: `${emoji} Buyurtma <b>#${order.orderNumber}</b> yetkazildi!\n\nYoqimli ishtaha! Bizni tanlaganingiz uchun rahmat! 🍢`,
      CANCELLED: `${emoji} Buyurtma <b>#${order.orderNumber}</b> bekor qilindi.\n\nSavollar bo'lsa, biz bilan bog'laning.`,
    },
    ru: {
      CONFIRMED: `${emoji} Заказ <b>#${order.orderNumber}</b> подтверждён!\n\nСкоро начнём готовить.`,
      PREPARING: `${emoji} Заказ <b>#${order.orderNumber}</b> готовится!\n\nПодождите немного, вкусные блюда готовятся.`,
      READY: `${emoji} Заказ <b>#${order.orderNumber}</b> готов!\n\nВаш заказ готов.`,
      DELIVERING: `${emoji} Заказ <b>#${order.orderNumber}</b> в пути!\n\nКурьер доставляет ваш заказ.`,
      COMPLETED: `${emoji} Заказ <b>#${order.orderNumber}</b> доставлен!\n\nПриятного аппетита! Спасибо, что выбрали нас! 🍢`,
      CANCELLED: `${emoji} Заказ <b>#${order.orderNumber}</b> отменён.\n\nЕсли есть вопросы, свяжитесь с нами.`,
    },
  };

  const langMessages = messages[lang] || messages.uz;
  const text = langMessages[order.status];

  if (text) {
    const result = await sendMessage(user.telegramId.toString(), text);
    if (result) {
      logger.info(`Status notification sent to user ${user.telegramId}`, {
        orderNumber: order.orderNumber,
        status: order.status,
      });
    }
    return result;
  }

  return null;
}

/**
 * Send full order details to Admins telegram group
 */
async function sendOrderToAdmins(user, order, branch) {
  const adminChatId = process.env.ADMIN_CHAT_ID;
  
  if (!adminChatId) {
    logger.warn('ADMIN_CHAT_ID is not defined in .env. Admin notification skipped.');
    return null;
  }

  const itemsList = order.items
    .map((item) => `  • ${item.name} × ${item.quantity}`)
    .join('\n');

  let locationText = '';
  if (order.deliveryType === 'DELIVERY' || order.deliveryType === 'YANDEX') {
    if (order.address) {
      locationText += `\nManzil: ${order.address}`;
    }
    if (order.latitude && order.longitude) {
      locationText += `\nXarita: https://maps.google.com/?q=${order.latitude},${order.longitude}`;
    } else if (user.latitude && user.longitude) {
      locationText += `\nXarita: https://maps.google.com/?q=${user.latitude},${user.longitude}`;
    }
  }

  const deliveryType = order.deliveryType === 'YANDEX' ? '🚕 Yandex (Oldindan to\'lov talab etilishi mumkin)' : (deliveryTypeLabels[order.deliveryType]?.uz || order.deliveryType);

  const text = `🚨 <b>YANGI BUYURTMA</b> 🚨\n
📋 Buyurtma: <b>#${order.orderNumber}</b>
📍 Filial: ${branch.name}
🚚 Turi: ${deliveryType}
👤 Mijoz: ${user.firstName || ''} ${user.lastName || ''}
📞 Telefon: ${order.phone || user.phone}
${locationText}

🍢 <b>Taomlar:</b>
${itemsList}

💰 <b>Jami: ${formatPrice(order.total)} so'm</b>
💬 Izoh: ${order.comment || 'Yo\'q'}`;

  const result = await sendMessage(adminChatId, text);
  if (result) {
    logger.info(`Order notification sent to Admin Group`, { orderNumber: order.orderNumber });
  }
  return result;
}

module.exports = {
  sendOrderNotification,
  sendStatusNotification,
  sendOrderToAdmins,
};
