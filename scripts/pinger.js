// ============================================
// USMON SHASHLIK — 24/7 Render Keep-Alive Pinger
// ============================================

const https = require('https');

const PING_URL = 'https://usmon-shashlik.onrender.com/api/health';
const INTERVAL_MS = 10 * 60 * 1000; // Har 10 daqiqada

function ping() {
  const now = new Date().toISOString();
  https.get(PING_URL, (res) => {
    console.log(`[${now}] ✅ Render Keep-Alive ping muvaffaqiyatli: HTTP ${res.statusCode}`);
  }).on('error', (err) => {
    console.warn(`[${now}] ⚠️ Ping xatolik: ${err.message}`);
  });
}

console.log(`============================================`);
console.log(`🚀 Render 24/7 Keep-Alive Pinger ishga tushdi`);
console.log(`🌐 Manzil: ${PING_URL}`);
console.log(`⏰ Interval: Har 10 daqiqada`);
console.log(`============================================`);

// Darhol birinchi pingni jo'natish
ping();

// Har 10 daqiqada takrorlash
setInterval(ping, INTERVAL_MS);
