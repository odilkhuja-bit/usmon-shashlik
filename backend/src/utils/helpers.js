// ============================================
// USMON SHASHLIK — Helper Utilities
// ============================================

/**
 * Generate unique order number: USM-XXXXXX
 */
function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `USM-${timestamp.slice(-4)}${random}`;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Format price to display string: 85 000 so'm
 */
function formatPrice(price) {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Calculate discount percentage
 */
function calcDiscount(oldPrice, newPrice) {
  if (!oldPrice || oldPrice <= newPrice) return 0;
  return Math.round(((oldPrice - newPrice) / oldPrice) * 100);
}

/**
 * Validate Telegram WebApp initData
 */
const crypto = require('crypto');

function validateTelegramInitData(initData, botToken) {
  if (!initData || !botToken) return null;

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;

    params.delete('hash');
    const entries = Array.from(params.entries());
    entries.sort(([a], [b]) => a.localeCompare(b));
    const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculatedHash !== hash) return null;

    const userStr = params.get('user');
    if (!userStr) return null;

    return JSON.parse(userStr);
  } catch (err) {
    return null;
  }
}

/**
 * Order status labels (bilingual)
 */
const orderStatusLabels = {
  NEW: { uz: 'Yangi', ru: 'Новый' },
  CONFIRMED: { uz: 'Tasdiqlandi', ru: 'Подтверждён' },
  PREPARING: { uz: 'Tayyorlanmoqda', ru: 'Готовится' },
  READY: { uz: 'Tayyor', ru: 'Готов' },
  DELIVERING: { uz: 'Yetkazilmoqda', ru: 'Доставляется' },
  COMPLETED: { uz: 'Tugallandi', ru: 'Завершён' },
  CANCELLED: { uz: 'Bekor qilindi', ru: 'Отменён' },
};

/**
 * Delivery type labels
 */
const deliveryTypeLabels = {
  DELIVERY: { uz: '🚚 Yetkazib berish', ru: '🚚 Доставка' },
  PICKUP: { uz: '🏃 Olib ketish', ru: '🏃 Самовывоз' },
  DINE_IN: { uz: '🍽 Restoranda', ru: '🍽 В ресторане' },
};

module.exports = {
  generateOrderNumber,
  calculateDistance,
  formatPrice,
  calcDiscount,
  validateTelegramInitData,
  orderStatusLabels,
  deliveryTypeLabels,
};
