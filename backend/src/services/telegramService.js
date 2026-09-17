// ============================================
// USMON SHASHLIK — Telegram Service
// ============================================

const logger = require('../utils/logger');

let bot = null;

function setBot(botInstance) {
  bot = botInstance;
}

function getBot() {
  return bot;
}

/**
 * Send message to a Telegram user
 */
async function sendMessage(chatId, text, options = {}) {
  if (!bot) {
    logger.warn('Bot not initialized, cannot send message');
    return null;
  }

  try {
    return await bot.sendMessage(chatId, text, {
      parse_mode: 'HTML',
      ...options,
    });
  } catch (error) {
    // User blocked the bot
    if (error.response && error.response.statusCode === 403) {
      logger.info(`User ${chatId} has blocked the bot`);
      return { blocked: true };
    }
    logger.error(`Failed to send message to ${chatId}:`, error.message);
    return null;
  }
}

/**
 * Send photo with caption to a Telegram user
 */
async function sendPhoto(chatId, photoUrl, caption, options = {}) {
  if (!bot) return null;

  try {
    return await bot.sendPhoto(chatId, photoUrl, {
      caption,
      parse_mode: 'HTML',
      ...options,
    });
  } catch (error) {
    if (error.response && error.response.statusCode === 403) {
      return { blocked: true };
    }
    logger.error(`Failed to send photo to ${chatId}:`, error.message);
    return null;
  }
}

module.exports = {
  setBot,
  getBot,
  sendMessage,
  sendPhoto,
};
