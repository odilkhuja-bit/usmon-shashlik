// ============================================
// USMON SHASHLIK — Client Routes
// ============================================

const { Router } = require('express');
const { telegramAuth } = require('../middlewares/auth.middleware');
const client = require('../controllers/clientController');

const router = Router();

// Public routes (anyone can view menu and branches)
router.get('/settings', client.getSettings);
router.get('/branches', client.getBranches);
router.get('/products', client.getProducts);
router.get('/categories', client.getCategories);
router.get('/stories', client.getStories);
router.get('/upsell', client.getUpsellProducts);

// Protected routes (Telegram auth)
router.use(telegramAuth);

router.get('/profile', client.getProfile);
router.put('/profile', client.updateProfile);
router.post('/favorites/toggle', client.toggleFavorite);
router.get('/favorites', client.getFavorites);

module.exports = router;
