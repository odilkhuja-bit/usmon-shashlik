// ============================================
// USMON SHASHLIK — Admin Routes
// ============================================

const { Router } = require('express');
const { adminAuth, requireRole } = require('../middlewares/admin.middleware');
const { validateProduct, validateBranch, validateBroadcast } = require('../middlewares/validation.middleware');
const admin = require('../controllers/adminController');
const order = require('../controllers/orderController');
const product = require('../controllers/productController');
const branch = require('../controllers/branchController');
const user = require('../controllers/userController');
const broadcast = require('../controllers/broadcastController');
const analytics = require('../controllers/analyticsController');
const settings = require('../controllers/settingsController');
const category = require('../controllers/categoryController');
const story = require('../controllers/storyController');

const router = Router();

// ─── Auth ────────────────────────────────────
router.post('/login', admin.login);

// All subsequent routes require admin auth
router.use(adminAuth);

// ─── Admin Profile ───────────────────────────
router.get('/me', admin.getMe);
router.put('/change-password', admin.changePassword);

// ─── Dashboard ───────────────────────────────
router.get('/dashboard', analytics.getDashboard);

// ─── Orders ──────────────────────────────────
router.get('/orders', order.adminGetOrders);
router.get('/orders/export', order.exportOrdersCsv);
router.get('/orders/:id', order.adminGetOrder);
router.patch('/orders/:id', order.adminUpdateStatus);
router.patch('/orders/:id/items', order.adminUpdateOrderItems);
// ─── Products ────────────────────────────────
router.get('/products', product.getAll);
router.get('/products/:id', product.getOne);
router.post('/products', requireRole('SUPER_ADMIN', 'ADMIN'), validateProduct, product.create);
router.put('/products/:id', requireRole('SUPER_ADMIN', 'ADMIN'), product.update);
router.delete('/products/:id', requireRole('SUPER_ADMIN', 'ADMIN'), product.softDelete);
router.patch('/products/:id/restore', requireRole('SUPER_ADMIN', 'ADMIN'), product.restore);
router.delete('/products/:id/permanent', requireRole('SUPER_ADMIN'), product.permanentDelete);

// ─── Categories ──────────────────────────────
router.get('/categories', category.getAll);
router.post('/categories', requireRole('SUPER_ADMIN', 'ADMIN'), category.create);
router.put('/categories/:id', requireRole('SUPER_ADMIN', 'ADMIN'), category.update);
router.delete('/categories/:id', requireRole('SUPER_ADMIN', 'ADMIN'), category.remove);

// ─── Branches ────────────────────────────────
router.get('/branches', branch.getAll);
router.get('/branches/:id', branch.getOne);
router.post('/branches', requireRole('SUPER_ADMIN', 'ADMIN'), validateBranch, branch.create);
router.put('/branches/:id', requireRole('SUPER_ADMIN', 'ADMIN'), branch.update);
router.delete('/branches/:id', requireRole('SUPER_ADMIN'), branch.remove);

// ─── Users ───────────────────────────────────
router.get('/users', requireRole('SUPER_ADMIN', 'ADMIN'), user.getAll);
router.get('/users/export', requireRole('SUPER_ADMIN', 'ADMIN'), user.exportUsersCsv);
router.get('/users/:id', requireRole('SUPER_ADMIN', 'ADMIN'), user.getOne);
router.patch('/users/:id/block', requireRole('SUPER_ADMIN', 'ADMIN'), user.toggleBlock);

// ─── Broadcast ───────────────────────────────
router.get('/broadcast', requireRole('SUPER_ADMIN', 'ADMIN'), broadcast.getHistory);
router.get('/broadcast/target-count', requireRole('SUPER_ADMIN', 'ADMIN'), broadcast.getTargetCount);
router.get('/broadcast/:id', requireRole('SUPER_ADMIN', 'ADMIN'), broadcast.getOne);
router.post('/broadcast', requireRole('SUPER_ADMIN', 'ADMIN'), validateBroadcast, broadcast.create);

// ─── Analytics ───────────────────────────────
router.get('/analytics', requireRole('SUPER_ADMIN', 'ADMIN'), analytics.getAnalytics);
router.get('/analytics/revenue', requireRole('SUPER_ADMIN', 'ADMIN'), analytics.getRevenueChart);
router.get('/analytics/popular', requireRole('SUPER_ADMIN', 'ADMIN'), analytics.getPopularProducts);
router.get('/analytics/branches', requireRole('SUPER_ADMIN', 'ADMIN'), analytics.getBranchStats);

// ─── Stories ─────────────────────────────────
router.get('/stories', story.getAll);
router.post('/stories', requireRole('SUPER_ADMIN', 'ADMIN'), story.create);
router.put('/stories/:id', requireRole('SUPER_ADMIN', 'ADMIN'), story.update);
router.delete('/stories/:id', requireRole('SUPER_ADMIN', 'ADMIN'), story.remove);

// ─── Admins ──────────────────────────────────
router.get('/admins', requireRole('SUPER_ADMIN'), admin.getAdmins);
router.post('/admins', requireRole('SUPER_ADMIN'), admin.createAdmin);
router.put('/admins/:id', requireRole('SUPER_ADMIN'), admin.updateAdmin);
router.delete('/admins/:id', requireRole('SUPER_ADMIN'), admin.deleteAdmin);

// ─── Settings ────────────────────────────────
router.get('/settings', requireRole('SUPER_ADMIN', 'ADMIN'), settings.getAll);
router.put('/settings', requireRole('SUPER_ADMIN'), settings.update);

module.exports = router;
