// ============================================
// USMON SHASHLIK — Telegram WebApp Utilities
// ============================================

/**
 * Get Telegram WebApp instance
 */
export function getTelegram() {
  return window.Telegram?.WebApp || null;
}

/**
 * Get initData string for backend auth
 */
export function getInitData() {
  const tg = getTelegram();
  return tg?.initData || '';
}

/**
 * Get Telegram user info
 */
export function getTelegramUser() {
  const tg = getTelegram();
  return tg?.initDataUnsafe?.user || null;
}

/**
 * Tell Telegram the app is ready
 */
export function ready() {
  const tg = getTelegram();
  if (tg) {
    tg.ready();
    tg.expand();
    tg.enableClosingConfirmation();
  }
}

export function initTelegramApp() {
  ready();
}

/**
 * Close Mini App
 */
export function closeApp() {
  const tg = getTelegram();
  if (tg) tg.close();
}

/**
 * Haptic feedback
 */
export function haptic(type = 'light') {
  const tg = getTelegram();
  if (tg?.HapticFeedback) {
    if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
    else if (type === 'error') tg.HapticFeedback.notificationOccurred('error');
    else if (type === 'warning') tg.HapticFeedback.notificationOccurred('warning');
    else if (type === 'medium') tg.HapticFeedback.impactOccurred('medium');
    else if (type === 'heavy') tg.HapticFeedback.impactOccurred('heavy');
    else tg.HapticFeedback.impactOccurred('light');
  }
}

/**
 * Request contact from Telegram
 */
export function requestContact() {
  return new Promise((resolve) => {
    const tg = getTelegram();
    if (tg?.requestContact) {
      tg.requestContact((sent, event) => {
        if (sent && event?.responseUnsafe?.contact) {
          resolve(event.responseUnsafe.contact);
        } else {
          resolve(null);
        }
      });
    } else {
      resolve(null);
    }
  });
}

/**
 * Get user language from Telegram
 */
export function getTelegramLanguage() {
  const user = getTelegramUser();
  return user?.language_code === 'ru' ? 'ru' : 'uz';
}
