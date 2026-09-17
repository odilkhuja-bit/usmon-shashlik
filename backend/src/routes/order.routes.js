// ============================================
// USMON SHASHLIK — Order Routes
// ============================================

const { Router } = require('express');
const { telegramAuth } = require('../middlewares/auth.middleware');
const { validateOrder } = require('../middlewares/validation.middleware');
const order = require('../controllers/orderController');

const router = Router();

// Client order routes (Telegram auth)
router.use(telegramAuth);

router.post('/', validateOrder, order.create);
router.get('/', order.getUserOrders);
router.get('/:id', order.getOrderDetail);

module.exports = router;
