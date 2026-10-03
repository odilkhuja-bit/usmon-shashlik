# AGENTS.md — USMON SHASHLIK Project Knowledge & AI Guidelines

Ushbu hujjat AI agentlari (Antigravity va boshqalar) va dasturchilar uchun loyiha konteksti, arxitekturasi va yuzaga kelgan muammolarni darhol tushunish uchun yaratilgan.

---

## 📌 Loyiha haqida qisqacha
* **Loyiha nomi:** USMON SHASHLIK
* **Texnologiyalar:** Node.js, Express, Socket.IO, Prisma ORM, PostgreSQL (Render), React 18, Vite.
* **Telegram Bot:** `@usmonshashlik_bot` (`node-telegram-bot-api`, polling rejimida).
* **Hosting:** Render.com (Bepul "Free Web Service" tarifi).
* **Render URL:** `https://usmon-shashlik.onrender.com`
* **Admin URL:** `https://usmon-shashlik.onrender.com/admin/orders`
* **Health API:** `https://usmon-shashlik.onrender.com/api/health`

---

## 🔑 Telegram Bot Tokeni haqida MUHIM MA'LUMOT
* ✅ **Haqiqiy faol token:** `8832100007:AAEucfq-mUrzMPEzhdll72BjvH1WUqYa3g0` (Telegram API `getMe` da `200 OK`).
* ❌ **Eski / Yaroqsiz token:** `8832100007:AAHjZpn6CKLPgPHPnzUAnRsJR9rqRpTjz8g` (Telegram API da `401 Unauthorized`).
* **OGOHLANTIRISH:** Hech qachon `render.yaml` yoki `backend/.env` ga `AAHj...` tokenini qaytarmang!

---

## 🚨 Yuzaga kelgan muammolar va ularning sabablari (Incident History)

### 1. Bot o'chib qolishi (Render Free Spin-Down / Sleep)
* **Sabab:** Render Free rejimida 15 daqiqa davomida saytga yoki adminga HTTP so'rov kelmasa, butun server avtomatik "Sleep" (Spin Down) ga tushadi. Telegram Bot esa server ichida polling rejimida ishlagani uchun server bilan birga o'chib qolar edi. Telegramdan kelgan xabarlar esa HTTP so'rov bo'lmagani uchun Render'ni uyg'ota olmas edi.
* **Yechim:**
  1. `.github/workflows/keep-alive.yml` orqali GitHub Actions har 10 daqiqada `https://usmon-shashlik.onrender.com/api/health` manziliga ping yuborib, Render'ni 24/7 uyg'oq saqlaydi.
  2. `backend/src/index.js` server ichida o'z-o'zini ping qiluvchi avtomatik taymer qo'shilgan.
  3. `scripts/pinger.js` va `start-pinger.bat` orqali lokal kompyuterdan ham har 10 daqiqada ping yuborish imkoniyati bor.

### 2. Mini App WebApp HTTPS talabi va Node.js Crash
* **Sabab:** Telegram Bot API da `inline_keyboard` dagi `web_app: { url }` parametri FAQAT VA FAQAT `https://` havolalarni qabul qiladi. `http://` bo'lsa Telegram `400 Bad Request` xatosini qaytaradi.
* Oldin `bot.js` dagi `sendMenu` funksiyasi `await` qilinmagani va `try/catch` yo'qligi sababli, `unhandledRejection` yuz berib, butun Node.js server o'chib qolgan.
* **Yechim:**
  1. `backend/src/core/bot.js` ichidagi `sendMenu` doimiy ravishda `https://usmon-shashlik.onrender.com` ga fallback qiladi va `https://` tekshiriladi.
  2. Barcha bot chaqiruvlari `await` qilindi va `try/catch` bilan o'raldi.
  3. `backend/src/index.js` ga global `unhandledRejection` va `uncaughtException` tutqichlari qo'yildi, shu sababli xatolik bo'lsa ham server o'chmaydi.

### 3. Telegram 409 Conflict (Polling Conflict)
* **Sabab:** Bitta bot tokeni bilan bir vaqtda ikkita joyda (masalan, Render serverda va lokal kompyuterda `npm run dev`) polling ishga tushsa, Telegram `409 Conflict` beradi va ikkala tomonda ham bot uziladi.
* **Qoida:** Agar bot Render'da ishlayotgan bo'lsa, lokal kompyuterda `start-backend.bat` ni bir vaqtda yoqmaslik yoki alohida test-bot tokendan foydalanish kerak.

---

## 🛠️ Tezkor diagnostika buyruqlari

```bash
# 1. Telegram bot holatini tekshirish
curl -i "https://api.telegram.org/bot8832100007:AAEucfq-mUrzMPEzhdll72BjvH1WUqYa3g0/getMe"

# 2. Render serverining salomatligini tekshirish
curl -i "https://usmon-shashlik.onrender.com/api/health"

# 3. Lokal pinger'ni ishga tushirish
start-pinger.bat
```
