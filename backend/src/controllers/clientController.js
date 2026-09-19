// ============================================
// USMON SHASHLIK — Client Controller
// ============================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get user profile
 */
async function getProfile(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        selectedBranch: true,
        _count: { select: { orders: true } },
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Calculate total spent
    const totalSpent = await prisma.order.aggregate({
      where: { userId: user.id, status: { not: 'CANCELLED' } },
      _sum: { total: true },
    });

    res.json({
      id: user.id,
      telegramId: user.telegramId.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      phone: user.phone,
      language: user.language,
      latitude: user.latitude,
      longitude: user.longitude,
      selectedBranch: user.selectedBranch,
      orderCount: user._count.orders,
      totalSpent: totalSpent._sum.total || 0,
      createdAt: user.createdAt,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user profile
 */
async function updateProfile(req, res, next) {
  try {
    const { firstName, lastName, phone, language, latitude, longitude, selectedBranchId } = req.body;

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (language !== undefined) updateData.language = language;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (selectedBranchId !== undefined) updateData.selectedBranchId = selectedBranchId;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      include: { selectedBranch: true },
    });

    res.json({
      id: user.id,
      telegramId: user.telegramId.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      phone: user.phone,
      language: user.language,
      selectedBranch: user.selectedBranch,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get products (active, non-deleted)
 */
async function getProducts(req, res, next) {
  try {
    const { categoryId, search } = req.query;

    const where = { isDeleted: false, isAvailable: true };
    if (categoryId) where.categoryId = parseInt(categoryId);
    if (search) {
      where.OR = [
        { nameUz: { contains: search, mode: 'insensitive' } },
        { nameRu: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    });

    res.json(products);
  } catch (error) {
    next(error);
  }
}

/**
 * Get categories
 */
async function getCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { products: { where: { isDeleted: false } } } },
      },
    });

    res.json(categories);
  } catch (error) {
    next(error);
  }
}

/**
 * Get branches
 */
async function getBranches(req, res, next) {
  try {
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    });

    res.json(branches);
  } catch (error) {
    next(error);
  }
}

/**
 * Get stories
 */
async function getStories(req, res, next) {
  try {
    const popularProducts = await prisma.product.findMany({
      where: { isUpsell: true, isAvailable: true, isDeleted: false },
      orderBy: { sortOrder: 'asc' },
    });

    const stories = popularProducts.map(p => ({
      id: p.id,
      title: p.nameUz,
      titleRu: p.nameRu,
      imageUrl: p.imageUrl || '',
      bgColor: '#E85D04',
      isProduct: true,
      originalProduct: p
    }));

    res.json(stories);
  } catch (error) {
    next(error);
  }
}

/**
 * Get settings (public)
 */
async function getSettings(req, res, next) {
  try {
    const settings = await prisma.setting.findMany();
    const settingsObj = {};
    settings.forEach((s) => (settingsObj[s.key] = s.value));
    res.json(settingsObj);
  } catch (error) {
    next(error);
  }
}

/**
 * Get upsell products
 */
async function getUpsellProducts(req, res, next) {
  try {
    const products = await prisma.product.findMany({
      where: { isUpsell: true, isDeleted: false, isAvailable: true },
      orderBy: { price: 'asc' },
      take: 5,
    });

    res.json(products);
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle favorite
 */
async function toggleFavorite(req, res, next) {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'Product ID required' });

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_productId: { userId: req.user.id, productId },
      },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return res.json({ favorited: false });
    }

    await prisma.favorite.create({
      data: { userId: req.user.id, productId },
    });

    res.json({ favorited: true });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user favorites
 */
async function getFavorites(req, res, next) {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: {
        product: { include: { category: true } },
      },
    });

    res.json(favorites.map((f) => f.product));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  getProducts,
  getCategories,
  getBranches,
  getStories,
  getSettings,
  getUpsellProducts,
  toggleFavorite,
  getFavorites,
};
