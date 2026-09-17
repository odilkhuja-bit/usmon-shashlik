// ============================================
// USMON SHASHLIK — Settings Controller (Admin)
// ============================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get all settings
 */
async function getAll(req, res, next) {
  try {
    const settings = await prisma.setting.findMany();
    const obj = {};
    settings.forEach((s) => (obj[s.key] = s.value));
    res.json(obj);
  } catch (error) {
    next(error);
  }
}

/**
 * Update settings
 */
async function update(req, res, next) {
  try {
    const updates = req.body;

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Settings object required' });
    }

    for (const [key, value] of Object.entries(updates)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    const settings = await prisma.setting.findMany();
    const obj = {};
    settings.forEach((s) => (obj[s.key] = s.value));

    res.json(obj);
  } catch (error) {
    next(error);
  }
}

module.exports = { getAll, update };
