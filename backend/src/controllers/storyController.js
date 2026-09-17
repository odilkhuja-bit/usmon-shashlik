// ============================================
// USMON SHASHLIK — Story Controller (Admin)
// ============================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getAll(req, res, next) {
  try {
    const stories = await prisma.story.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json(stories);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const { title, imageUrl, bgColor, sortOrder } = req.body;
    if (!title || !imageUrl) {
      return res.status(400).json({ error: 'Title and imageUrl are required' });
    }

    const story = await prisma.story.create({
      data: {
        title,
        imageUrl,
        bgColor: bgColor || '#E85D04',
        sortOrder: sortOrder || 0,
      },
    });

    res.status(201).json(story);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const data = {};

    if (req.body.title !== undefined) data.title = req.body.title;
    if (req.body.imageUrl !== undefined) data.imageUrl = req.body.imageUrl;
    if (req.body.bgColor !== undefined) data.bgColor = req.body.bgColor;
    if (req.body.sortOrder !== undefined) data.sortOrder = req.body.sortOrder;
    if (req.body.isActive !== undefined) data.isActive = req.body.isActive;

    const story = await prisma.story.update({ where: { id }, data });
    res.json(story);
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    await prisma.story.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Story deleted' });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAll, create, update, remove };
