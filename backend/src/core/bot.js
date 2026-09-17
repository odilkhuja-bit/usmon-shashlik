// ============================================
// USMON SHASHLIK — Telegram Bot
// ============================================

const TelegramBot = require('node-telegram-bot-api');
const { PrismaClient } = require('@prisma/client');
const config = require('../config/default');
const { setBot } = require('../services/telegramService');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

function initBot() {
  const token = config.telegram.botToken;
  if (!token || token.includes('YOUR_BOT_TOKEN') || token.length < 20) {
    logger.warn('⚠️  TELEGRAM_BOT_TOKEN is not configured in .env. Bot polling skipped. Set valid token to activate Telegram bot.');
    return null;
  }

  const bot = new TelegramBot(config.telegram.botToken, { polling: true });
  setBot(bot);

  logger.info('🤖 Telegram Bot started');

  // ─── /start command ──────────────────────────
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const from = msg.from;

    try {
      // Find or create user
      let user = await prisma.user.findUnique({
        where: { telegramId: BigInt(from.id) },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            telegramId: BigInt(from.id),
            firstName: from.first_name || null,
            lastName: from.last_name || null,
            username: from.username || null,
            language: from.language_code === 'ru' ? 'ru' : 'uz',
          },
        });
        logger.info('New user registered via bot', { telegramId: from.id, name: from.first_name });
      } else {
        // Update user info
        await prisma.user.update({
          where: { telegramId: BigInt(from.id) },
          data: {
            firstName: from.first_name || user.firstName,
            lastName: from.last_name || user.lastName,
            username: from.username || user.username,
          },
        });
      }

      const lang = user.language || (from.language_code === 'ru' ? 'ru' : 'uz');

      const messages = {
        uz: `Assalomu alaykum, ${from.first_name || 'Mehmon'}! 👋\n\n🍢 <b>USMON SHASHLIK</b>ga xush kelibsiz!\n\nYangi tayyorlangan shashlik va mazali taomlarni tez va qulay buyurtma qiling.\n\nQuyidagi tugmani bosib, menyuni oching:`,
        ru: `Здравствуйте, ${from.first_name || 'Гость'}! 👋\n\n🍢 Добро пожаловать в <b>УСМОН ШАШЛЫК</b>!\n\nЗаказывайте свежеприготовленный шашлык и вкусные блюда быстро и удобно.\n\nНажмите кнопку ниже, чтобы открыть меню:`,
      };

      const buttonTexts = {
        uz: '🍢 USMON SHASHLIK MENYUSI',
        ru: '🍢 МЕНЮ УСМОН ШАШЛЫК',
      };

      const miniAppUrl = config.ngrokUrl || config.clientUrl;

      await bot.sendMessage(chatId, messages[lang] || messages.uz, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: buttonTexts[lang] || buttonTexts.uz,
                web_app: { url: miniAppUrl },
              },
            ],
          ],
        },
      });
    } catch (error) {
      logger.error('Bot /start error:', error);
    }
  });

  // ─── /help command ───────────────────────────
  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;

    await bot.sendMessage(
      chatId,
      `🍢 <b>USMON SHASHLIK</b>\n\n📋 Buyurtma berish uchun menyuni oching.\n📞 Aloqa: +998 90 123 45 67\n\n/start - Menyuni ochish`,
      { parse_mode: 'HTML' }
    );
  });

  // ─── Handle errors ───────────────────────────
  bot.on('polling_error', (error) => {
    if (error.code === 'EFATAL' || error.message?.includes('409')) {
      logger.error('Bot polling conflict. Make sure only one instance is running.');
    } else {
      logger.error('Bot polling error:', error.message);
    }
  });

  return bot;
}

module.exports = { initBot };
