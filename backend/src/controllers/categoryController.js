// ============================================
// USMON SHASHLIK — Category Controller (Admin)
// ============================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get all categories (admin)
 */
async function getAll(req, res, next) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    });

    res.json(categories);
  } catch (error) {
    next(error);
  }
}

/**
 * Create category
 */
async function create(req, res, next) {
  try {
    const { nameUz, nameRu, slug, icon, sortOrder } = req.body;

    if (!nameUz || !nameRu || !slug) {
      return res.status(400).json({ error: 'nameUz, nameRu, and slug are required' });
    }

    const category = await prisma.category.create({
      data: {
        nameUz,
        nameRu,
        slug,
        icon: icon || null,
        sortOrder: sortOrder || 0,
      },
    });

    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
}

/**
 * Update category
 */
async function update(req, res, next) {
  try {
    const categoryId = parseInt(req.params.id);
    const data = {};

    if (req.body.nameUz !== undefined) data.nameUz = req.body.nameUz;
    if (req.body.nameRu !== undefined) data.nameRu = req.body.nameRu;
    if (req.body.slug !== undefined) data.slug = req.body.slug;
    if (req.body.icon !== undefined) data.icon = req.body.icon;
    if (req.body.sortOrder !== undefined) data.sortOrder = req.body.sortOrder;
    if (req.body.isActive !== undefined) data.isActive = req.body.isActive;

    const category = await prisma.category.update({
      where: { id: categoryId },
      data,
    });

    res.json(category);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete category
 */
async function remove(req, res, next) {
  try {
    const categoryId = parseInt(req.params.id);

    const productCount = await prisma.product.count({ where: { categoryId } });
    if (productCount > 0) {
      return res.status(400).json({
        error: `Cannot delete category with ${productCount} products`,
      });
    }

    await prisma.category.delete({ where: { id: categoryId } });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAll, create, update, remove };
