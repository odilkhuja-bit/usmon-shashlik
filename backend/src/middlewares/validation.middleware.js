// ============================================
// USMON SHASHLIK — Validation Middleware
// ============================================

/**
 * Validate order creation input
 */
function validateOrder(req, res, next) {
  const { items, branchId, deliveryType, phone } = req.body;

  const errors = [];

  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.push('Items are required');
  } else {
    items.forEach((item, i) => {
      if (!item.productId) errors.push(`Item ${i + 1}: productId is required`);
      if (!item.quantity || item.quantity < 1) errors.push(`Item ${i + 1}: quantity must be at least 1`);
    });
  }

  if (!branchId) errors.push('Branch is required');

  const validTypes = ['DELIVERY', 'PICKUP', 'DINE_IN'];
  if (!deliveryType || !validTypes.includes(deliveryType)) {
    errors.push('Valid delivery type is required (DELIVERY, PICKUP, DINE_IN)');
  }

  if (!phone) errors.push('Phone is required');

  if (deliveryType === 'DELIVERY') {
    if (!req.body.address) errors.push('Address is required for delivery');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
}

/**
 * Validate product creation/update input
 */
function validateProduct(req, res, next) {
  const { nameUz, nameRu, price, categoryId } = req.body;
  const errors = [];

  if (!nameUz) errors.push('Product name (UZ) is required');
  if (!nameRu) errors.push('Product name (RU) is required');
  if (!price || price < 0) errors.push('Valid price is required');
  if (!categoryId) errors.push('Category is required');

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
}

/**
 * Validate branch creation/update
 */
function validateBranch(req, res, next) {
  const { name, address, latitude, longitude } = req.body;
  const errors = [];

  if (!name) errors.push('Branch name is required');
  if (!address) errors.push('Address is required');
  if (latitude === undefined || latitude === null) errors.push('Latitude is required');
  if (longitude === undefined || longitude === null) errors.push('Longitude is required');

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
}

/**
 * Validate broadcast creation
 */
function validateBroadcast(req, res, next) {
  const { title, message } = req.body;
  const errors = [];

  if (!title) errors.push('Broadcast title is required');
  if (!message) errors.push('Broadcast message is required');

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
}

module.exports = {
  validateOrder,
  validateProduct,
  validateBranch,
  validateBroadcast,
};
