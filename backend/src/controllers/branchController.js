// ============================================
// USMON SHASHLIK — Branch Controller (Admin)
// ============================================

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Get all branches (admin)
 */
async function getAll(req, res, next) {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { id: 'asc' },
      include: {
        _count: { select: { orders: true, users: true } },
      },
    });

    res.json(branches);
  } catch (error) {
    next(error);
  }
}

/**
 * Get single branch
 */
async function getOne(req, res, next) {
  try {
    const branch = await prisma.branch.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        _count: { select: { orders: true, users: true } },
      },
    });

    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    res.json(branch);
  } catch (error) {
    next(error);
  }
}

/**
 * Create branch
 */
async function create(req, res, next) {
  try {
    const { name, nameRu, address, addressRu, phone, latitude, longitude, workingHours } = req.body;

    const branch = await prisma.branch.create({
      data: {
        name,
        nameRu: nameRu || null,
        address,
        addressRu: addressRu || null,
        phone: phone || null,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        workingHours: workingHours || '09:00-23:00',
      },
    });

    logger.info('Branch created', { id: branch.id, name: branch.name });

    res.status(201).json(branch);
  } catch (error) {
    next(error);
  }
}

/**
 * Update branch
 */
async function update(req, res, next) {
  try {
    const branchId = parseInt(req.params.id);
    const data = {};

    const fields = ['name', 'nameRu', 'address', 'addressRu', 'phone', 'workingHours'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) data[f] = req.body[f];
    });

    if (req.body.latitude !== undefined) data.latitude = parseFloat(req.body.latitude);
    if (req.body.longitude !== undefined) data.longitude = parseFloat(req.body.longitude);
    if (req.body.isActive !== undefined) data.isActive = req.body.isActive;

    const branch = await prisma.branch.update({
      where: { id: branchId },
      data,
    });

    logger.info('Branch updated', { id: branchId, name: branch.name });

    res.json(branch);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete branch
 */
async function remove(req, res, next) {
  try {
    const branchId = parseInt(req.params.id);

    // Check for related orders
    const orderCount = await prisma.order.count({ where: { branchId } });
    if (orderCount > 0) {
      return res.status(400).json({
        error: `Cannot delete branch with ${orderCount} existing orders. Deactivate it instead.`,
      });
    }

    // Update users to unselect this branch
    await prisma.user.updateMany({
      where: { selectedBranchId: branchId },
      data: { selectedBranchId: null },
    });

    await prisma.branch.delete({ where: { id: branchId } });

    logger.info('Branch deleted', { id: branchId });

    res.json({ message: 'Branch deleted' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAll,
  getOne,
  create,
  update,
  remove,
};
