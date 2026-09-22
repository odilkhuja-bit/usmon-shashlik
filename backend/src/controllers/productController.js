// ============================================
// USMON SHASHLIK — Product Controller (Admin)
// ============================================

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Get all products (admin, including deleted)
 */
async function getAll(req, res, next) {
  try {
    const { categoryId, search, showDeleted, showUnavailable } = req.query;

    const where = {};
    if (showDeleted === 'true') {
      where.isDeleted = true;
    } else if (showDeleted === 'all') {
      // Show all
    } else {
      where.isDeleted = false;
    }

    if (showUnavailable === 'true') {
      where.isAvailable = false;
    } else if (showUnavailable === 'false') {
      where.isAvailable = true;
    }

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
      orderBy: [{ isDeleted: 'asc' }, { category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    });

    res.json(products);
  } catch (error) {
    next(error);
  }
}

/**
 * Get single product
 */
async function getOne(req, res, next) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { category: true },
    });

    if (!product) return res.status(404).json({ error: 'Product not found' });

    res.json(product);
  } catch (error) {
    next(error);
  }
}

/**
 * Create product
 */
async function create(req, res, next) {
  try {
    const {
      nameUz, nameRu, descriptionUz, descriptionRu,
      imageUrl, oldPrice, price, categoryId,
      ingredientsUz, ingredientsRu, isAvailable,
      isUpsell, sortOrder,
    } = req.body;

    const product = await prisma.product.create({
      data: {
        nameUz,
        nameRu,
        descriptionUz: descriptionUz || null,
        descriptionRu: descriptionRu || null,
        imageUrl: imageUrl || null,
        oldPrice: oldPrice ? parseInt(oldPrice) : null,
        price: parseInt(price),
        categoryId: parseInt(categoryId),
        ingredientsUz: ingredientsUz || null,
        ingredientsRu: ingredientsRu || null,
        isAvailable: isAvailable !== false,
        isUpsell: isUpsell || false,
        sortOrder: sortOrder || 0,
      },
      include: { category: true },
    });

    logger.info('Product created', { id: product.id, name: product.nameUz });

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
}

/**
 * Update product
 */
async function update(req, res, next) {
  try {
    const productId = parseInt(req.params.id);
    const data = {};

    const fields = [
      'nameUz', 'nameRu', 'descriptionUz', 'descriptionRu',
      'imageUrl', 'ingredientsUz', 'ingredientsRu',
    ];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) data[f] = req.body[f];
    });

    if (req.body.oldPrice !== undefined) data.oldPrice = req.body.oldPrice ? parseInt(req.body.oldPrice) : null;
    if (req.body.price !== undefined) data.price = parseInt(req.body.price);
    if (req.body.categoryId !== undefined) data.categoryId = parseInt(req.body.categoryId);
    if (req.body.isAvailable !== undefined) data.isAvailable = req.body.isAvailable;
    if (req.body.isUpsell !== undefined) data.isUpsell = req.body.isUpsell;
    if (req.body.sortOrder !== undefined) data.sortOrder = req.body.sortOrder;

    const product = await prisma.product.update({
      where: { id: productId },
      data,
      include: { category: true },
    });

    logger.info('Product updated', { id: product.id, name: product.nameUz });

    res.json(product);
  } catch (error) {
    next(error);
  }
}

/**
 * Soft delete product (archive)
 */
async function softDelete(req, res, next) {
  try {
    const productId = parseInt(req.params.id);

    const product = await prisma.product.update({
      where: { id: productId },
      data: { isDeleted: true, isAvailable: false },
    });

    logger.info('Product archived', { id: productId, name: product.nameUz });

    res.json({ message: 'Product archived', product });
  } catch (error) {
    next(error);
  }
}

/**
 * Restore product from archive
 */
async function restore(req, res, next) {
  try {
    const productId = parseInt(req.params.id);

    const product = await prisma.product.update({
      where: { id: productId },
      data: { isDeleted: false, isAvailable: true },
    });

    logger.info('Product restored', { id: productId, name: product.nameUz });

    res.json({ message: 'Product restored', product });
  } catch (error) {
    next(error);
  }
}

/**
 * Permanent delete (SUPER_ADMIN only)
 */
async function permanentDelete(req, res, next) {
  try {
    const productId = parseInt(req.params.id);

    // Delete associated favorites first
    await prisma.favorite.deleteMany({ where: { productId } });
    await prisma.product.delete({ where: { id: productId } });

    logger.info('Product permanently deleted', { id: productId });

    res.json({ message: 'Product permanently deleted' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAll,
  getOne,
  create,
  update,
  softDelete,
  restore,
  permanentDelete,
};
