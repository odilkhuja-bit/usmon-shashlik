// ============================================
// USMON SHASHLIK — Telegram Auth Middleware
// ============================================

const { PrismaClient } = require('@prisma/client');
const { validateTelegramInitData } = require('../utils/helpers');
const config = require('../config/default');

const prisma = new PrismaClient();

/**
 * Middleware: Validate Telegram WebApp initData and attach user to request
 */
async function telegramAuth(req, res, next) {
  try {
    const initData = req.headers['x-telegram-init-data'];

    if (!initData) {
      // In development / browser testing mode, fallback to demo guest user
      const guestTelegramId = BigInt(999999999);
      let guestUser = await prisma.user.findUnique({ where: { telegramId: guestTelegramId } });
      if (!guestUser) {
        guestUser = await prisma.user.create({
          data: {
            telegramId: guestTelegramId,
            firstName: 'Mehmon',
            language: 'uz',
          },
        });
      }
      req.user = {
        ...guestUser,
        telegramId: guestUser.telegramId.toString(),
      };
      return next();
    }

    const telegramUser = validateTelegramInitData(initData, config.telegram.botToken);

    if (!telegramUser) {
      // If token is placeholder/dummy during development, fallback gracefully
      if (!config.telegram.botToken || config.telegram.botToken.includes('YOUR_BOT_TOKEN')) {
        const guestTelegramId = BigInt(999999999);
        let guestUser = await prisma.user.findUnique({ where: { telegramId: guestTelegramId } });
        if (!guestUser) {
          guestUser = await prisma.user.create({
            data: { telegramId: guestTelegramId, firstName: 'Mehmon', language: 'uz' },
          });
        }
        req.user = { ...guestUser, telegramId: guestUser.telegramId.toString() };
        return next();
      }
      return res.status(401).json({ error: 'Invalid Telegram authentication' });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramUser.id) },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: BigInt(telegramUser.id),
          firstName: telegramUser.first_name || null,
          lastName: telegramUser.last_name || null,
          username: telegramUser.username || null,
          language: telegramUser.language_code === 'ru' ? 'ru' : 'uz',
        },
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'User is blocked' });
    }

    // Attach user to request (convert BigInt to string for JSON serialization)
    req.user = {
      ...user,
      telegramId: user.telegramId.toString(),
    };

    next();
  } catch (error) {
    console.error('Telegram auth error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

module.exports = { telegramAuth };
