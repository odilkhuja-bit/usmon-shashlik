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

  const botStates = new Map(); // chatId -> state name

  async function sendMenu(botInstance, chatId, user) {
    const lang = user.language || 'uz';

    const messages = {
      uz: `Assalomu alaykum, ${user.firstName || 'Mehmon'}! 👋\n\n🍢 <b>USMON SHASHLIK</b>ga xush kelibsiz!\n\nYangi tayyorlangan shashlik va mazali taomlarni tez va qulay buyurtma qiling.\n\nQuyidagi tugmani bosib, menyuni oching:`,
      ru: `Здравствуйте, ${user.firstName || 'Гость'}! 👋\n\n🍢 Добро пожаловать в <b>УСМОН ШАШЛЫК</b>!\n\nЗаказывайте свежеприготовленный шашлык и вкусные блюда быстро и удобно.\n\nНажмите кнопку ниже, чтобы открыть меню:`,
    };

    const buttonTexts = {
      uz: '🍢 USMON SHASHLIK MENYUSI',
      ru: '🍢 МЕНЮ УСМОН ШАШЛЫК',
    };

    const miniAppUrl = process.env.RENDER_EXTERNAL_URL || config.ngrokUrl || config.clientUrl;

    await botInstance.sendMessage(chatId, messages[lang] || messages.uz, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: buttonTexts[lang] || buttonTexts.uz,
              web_app: { url: miniAppUrl },
            },
          ],
          [
            {
              text: lang === 'ru' ? '📍 Изменить локацию' : "📍 Lokatsiyani o'zgartirish",
              callback_data: 'change_location',
            }
          ]
        ],
      },
    });
  }

  // ─── /start command ──────────────────────────
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const from = msg.from;

    try {
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
      }

      const lang = user.language || 'uz';

      if (!user.phone) {
        botStates.set(chatId, 'AWAITING_PHONE');
        return bot.sendMessage(chatId, lang === 'ru' ? 'Пожалуйста, отправьте ваш номер телефона, нажав на кнопку ниже.' : 'Iltimos, pastdagi tugmani bosib telefon raqamingizni yuboring.', {
          reply_markup: {
            keyboard: [[{ text: lang === 'ru' ? '📱 Отправить контакт' : '📱 Kontaktni yuborish', request_contact: true }]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        });
      }

      if (!user.firstName || user.firstName === 'Mehmon') {
        botStates.set(chatId, 'AWAITING_NAME');
        return bot.sendMessage(chatId, lang === 'ru' ? 'Пожалуйста, введите ваше имя:' : 'Iltimos, ismingizni kiriting:');
      }

      if (!user.latitude || !user.longitude) {
        botStates.set(chatId, 'AWAITING_LOCATION');
        return bot.sendMessage(chatId, lang === 'ru' ? 'Пожалуйста, отправьте вашу локацию (адрес), нажав на кнопку ниже.' : 'Iltimos, pastdagi tugmani bosib manzilingizni (lokatsiya) yuboring.', {
          reply_markup: {
            keyboard: [[{ text: lang === 'ru' ? '📍 Отправить локацию' : '📍 Lokatsiyani yuborish', request_location: true }]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        });
      }

      // If all info exists, show menu
      sendMenu(bot, chatId, user);
    } catch (error) {
      logger.error('Bot /start error:', error);
    }
  });

  // ─── /clearall command (DANGER ZONE) ──────────────
  bot.onText(/\/clearall/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      await prisma.order.deleteMany({});
      await prisma.user.deleteMany({});
      botStates.clear();
      bot.sendMessage(chatId, "⚠️ Barcha ma'lumotlar (buyurtmalar va mijozlar) muvaffaqiyatli O'CHIRILDI.\n\nEndi botni qayta boshlash uchun /start bosing.");
    } catch (e) {
      logger.error('Error in /clearall:', e);
      bot.sendMessage(chatId, "Xatolik yuz berdi: " + e.message);
    }
  });

  bot.on('message', async (msg) => {
    if (msg.text === '/start' || msg.text === '/help' || msg.text === '/clearall') return;

    const chatId = msg.chat.id;
    const state = botStates.get(chatId);
    
    if (!state) return;

    try {
      let user = await prisma.user.findUnique({
        where: { telegramId: BigInt(chatId) },
      });
      if (!user) return;
      const lang = user.language || 'uz';

      if (state === 'AWAITING_PHONE') {
        if (msg.contact) {
          await prisma.user.update({
            where: { id: user.id },
            data: { phone: msg.contact.phone_number }
          });
          
          botStates.set(chatId, 'AWAITING_NAME');
          return bot.sendMessage(chatId, lang === 'ru' ? 'Спасибо! Теперь введите ваше имя:' : 'Rahmat! Endi ismingizni kiriting:', {
            reply_markup: { remove_keyboard: true }
          });
        } else {
          return bot.sendMessage(chatId, lang === 'ru' ? 'Пожалуйста, используйте кнопку отправки контакта.' : 'Iltimos, kontaktni yuborish tugmasidan foydalaning.');
        }
      }

      if (state === 'AWAITING_NAME') {
        if (msg.text) {
          await prisma.user.update({
            where: { id: user.id },
            data: { firstName: msg.text }
          });

          botStates.set(chatId, 'AWAITING_LOCATION');
          return bot.sendMessage(chatId, lang === 'ru' ? 'Отлично! Теперь отправьте вашу локацию (адрес).' : 'Ajoyib! Endi manzilingizni (lokatsiya) yuboring.', {
            reply_markup: {
              keyboard: [[{ text: lang === 'ru' ? '📍 Отправить локацию' : '📍 Lokatsiyani yuborish', request_location: true }]],
              resize_keyboard: true,
              one_time_keyboard: true
            }
          });
        }
      }

      if (state === 'AWAITING_LOCATION') {
        if (msg.location) {
          await prisma.user.update({
            where: { id: user.id },
            data: { latitude: msg.location.latitude, longitude: msg.location.longitude }
          });
          botStates.delete(chatId);
          
          await bot.sendMessage(chatId, lang === 'ru' ? 'Спасибо! Вы успешно зарегистрированы.' : 'Rahmat! Siz muvaffaqiyatli ro\'yxatdan o\'tdingiz.', {
            reply_markup: { remove_keyboard: true }
          });
          
          user = await prisma.user.findUnique({ where: { id: user.id } });
          sendMenu(bot, chatId, user);
        } else {
          return bot.sendMessage(chatId, lang === 'ru' ? 'Пожалуйста, используйте кнопку отправки локации.' : 'Iltimos, lokatsiyani yuborish tugmasidan foydalaning.');
        }
      }
    } catch (err) {
      logger.error('Bot message handling error:', err);
    }
  });
  // ─── Callback Queries ────────────────────────
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    try {
      if (data === 'change_location') {
        const user = await prisma.user.findUnique({ where: { telegramId: BigInt(chatId) } });
        if (!user) return;
        const lang = user.language || 'uz';
        
        botStates.set(chatId, 'AWAITING_LOCATION');
        await bot.sendMessage(chatId, lang === 'ru' ? 'Пожалуйста, отправьте вашу новую локацию (адрес), нажав на кнопку ниже.' : 'Iltimos, pastdagi tugmani bosib yangi manzilingizni (lokatsiya) yuboring.', {
          reply_markup: {
            keyboard: [[{ text: lang === 'ru' ? '📍 Отправить локацию' : '📍 Lokatsiyani yuborish', request_location: true }]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        });
        await bot.answerCallbackQuery(query.id);
      }
    } catch (error) {
      logger.error('Callback query error:', error);
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
