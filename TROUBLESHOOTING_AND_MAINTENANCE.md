# 📋 USMON SHASHLIK — Texnik Xizmat Ko'rsatish va Muammolarni Hal Qilish Qo'llanmasi (Troubleshooting & Maintenance Guide)

Ushbu hujjat **USMON SHASHLIK** loyihasida yuz bergan nosozliklar, ularning asl sabablari, berilgan buyruqlar, olingan javoblar va kelajakda muammolarni darhol hal qilish bo'yicha to'liq qo'llanmadir.

---

## 📌 1. Yuzaga Kelgan Asosiy Muammo

**Foydalanuvchi murojaati:**
> *"bot ishlamayapti tekshir nimaga ochib qolgan"*  
> *"hamamsini tekshir bu localda emas hosting da turibdi lekin shu xatolik bervotti"* (Ilova qilingan skrinshotda Render hostingining: `INCOMING HTTP REQUEST DETECTED ... SERVICE WAKING UP ... ALLOCATING COMPUTE RESOURCES ...` oynasi ko'ringan).

---

## 🔍 2. Tekshiruv Natijalari va Asl Sabablar

Tizim to'liq tahlil qilinganda muammoning 4 ta asosiy ildizi aniqlandi:

### 1-sabab: Render Free Tier "Spin Down" (Uxlash rejimi)
* **Muammo:** Render.com bepul tarifida 15 daqiqa davomida saytga HTTP so'rov kelmasa, butun server (Node.js) avtomatik to'xtatiladi.
* **Natija:** Telegram Bot Node.js ichida ishlagani uchun server bilan birga o'chib qolgan. Telegram orqali yuborilgan xabarlar Render'ni uyg'ota olmagan.
* **Uyg'onish sharti:** Faqat kimdir brauzerdan `https://usmon-shashlik.onrender.com/admin/orders` ga kirgandagina Render 50 soniyada arang uyg'ongan.

Ilgari token nomutanosibligi yuzaga kelgan edi:
1. Eskirgan token `render.yaml` va Render Dashboard'da qolib ketgan edi.
2. Yangi token esa `backend/.env` da saqlangan edi.

**Tekshiruv buyrug'i:**
```bash
# Telegram bot holatini tekshirish:
curl -i "https://api.telegram.org/bot<SIZNING_BOT_TOKEN>/getMe"
```
* Agar `401 Unauthorized` chiqsa — token bekor qilingan yoki xato kiritilgan.
* Agar `200 OK` chiqsa — token to'g'ri va bot faol.

### 3-sabab: Mini App URL xatosi va Node.js halokati (Crash)
* `bot.js` faylidagi `sendMenu` inline tugmasiga Mini App URL sifatida `http://localhost:3000` ketib qolgan.
* Telegram Bot API esa `web_app` havolasi uchun **faqat HTTPS** linklarni qabul qiladi.
* Telegram `400 Bad Request` xatosini qaytargan, va chaqiruv `try/catch` va `await` qilinmagani sababli Node.js jarayoni butunlay crash bo'lib o'chgan.

### 4-sabab: Polling mojarosi (409 Conflict)
* Agar Render'da bot ishlab turgan paytda, bir vaqtning o'zida lokal kompyuterda ham `start-backend.bat` ishga tushirilsa, bitta token bilan ikkita joyda Telegramdan xabar olishga urinish bo'ladi.
* Natijada Telegram `409 Conflict: terminated by other getUpdates request` berib, ikkala tomonni ham uzib tashlaydi.

---

## 🛠️ 3. Amalga Oshirilgan Yechimlar

### 1. `render.yaml` xavfsizlandi:
`render.yaml` faylida token gitga chiqib ketmasligi uchun `sync: false` qilindi:
```yaml
- key: TELEGRAM_BOT_TOKEN
  sync: false
```
Token faqat Render.com Dashboard'dagi **Environment** bo'limida saqlanadi.

### 2. `backend/src/core/bot.js` da xavfsizlik kuchaytirildi:
* `sendMenu` funksiyasi to'liq `try/catch` blokiga olindi.
* URL har doim tekshirilib, faqat `https://` bo'lgandagina `web_app` tugmasi yuboriladigan qilindi.
* Barcha chaqiruvlar `await sendMenu(bot, chatId, user);` shakliga keltirildi.

### 3. `backend/src/index.js` da Crash Protection va Server Keep-Alive qo'shildi:
* Node.js jarayoni uchun global `unhandledRejection` va `uncaughtException` tutqichlari qo'yildi (server kutilmagan Telegram xatolaridan to'xtab qolmaydi).
* Har 10 daqiqada o'z-o'ziga `/api/health` so'rovi yuboruvchi ichki taymer ulandi.

### 4. Bepul Pinger tizimlari o'rnatildi (Render 24/7 uyg'oq turishi uchun):
* **Bulutli Pinger (GitHub Actions):** `.github/workflows/keep-alive.yml` fayli orqali GitHub serverlari har 10 daqiqada Render'ga avtomatik so'rov jo'natib turadi (kompyuter o'chiq bo'lsa ham ishlaydi).
* **Lokal Pinger (Fon skripti):** `scripts/pinger.js` va `start-pinger.bat` yaratildi va fonda ishga tushirildi.

### 5-sabab: Eski botning bloklanishi va yangi bot yaratilishi
* **Muammo:** Ochiq repo tufayli bot tokeni sizib chiqib, tavsifi spammerlar tomonidan `@bratsese` ga o'zgartirilgan va Telegram ushbu botni qoidalarni buzgani uchun butunlay o'chirib tashlagan («Удалённый аккаунт»).
* **Yechim:** `@BotFather` orqali yangi toza bot ochildi: `@usmonshashlik_bot` (ID: `8986986202`). Token `backend/.env` va Render Dashboard'dagi `TELEGRAM_BOT_TOKEN` ga o'rnatildi.

### 6-sabab: Render Free PostgreSQL 30-kunlik muddati va P1001 xatoligi
* **Muammo:** Render bepul PostgreSQL ma'lumotlar bazalarini har 30 kunda avtomatik to'xtatadi («Suspended by Render»). Natijada Node server bazaga ulana olmasdan deploy vaqtida `Error: P1001: Can't reach database server at dpg-...:5432` xatoligi bilan to'xtab qolgan.
* **Yechim:**
  1. Render Dashboard'dan eski to'xtagan baza o'chirildi (`sudo delete database usmon-shashlik-db`).
  2. Yangi bepul PostgreSQL baza ochildi (`usmon-shashlik-db`).
  3. Yangi bazaning `Internal Database URL` manzili nusxalanib, `usmon-shashlik` Web Service -> **Environment** bo'limidagi `DATABASE_URL` ga kiritildi.
  4. Server ishga tushganda `prisma db push` va `seed.js` orqali menyu, filiallar va admin avtomatik tiklandi.

---

## 🚨 4. Kelajakda Muammo Bo'lsa — Tezkor Qadamlar (Checklist)

Agar qachondir bot ishlamay qolsa, quyidagi ketma-ketlikda 2 daqiqada tekshiring:

### 1-qadam. Render PostgreSQL bazasini tekshiring (Har 30 kunda!)
* [dashboard.render.com](https://dashboard.render.com) ga kiring.
* Agar **`usmon-shashlik-db`** yonida qizil **`Suspended by Render`** yozuvi tursa:
  1. Uni o'chiring (`Delete Database`).
  2. Yangi `usmon-shashlik-db` yarating (`+ New` -> `PostgreSQL`, Plan: `Free`).
  3. Yangi bazaning `Internal Database URL` ini nusxalab, `usmon-shashlik` -> **Environment** -> `DATABASE_URL` ga qo'ying va saqlang.
  *Ma'lumotlar avtomatik `seed.js` orqali qayta to'ldiriladi!*

### 2-qadam. Telegram tokenini tekshiring
Terminalda buyruq bering:
```bash
curl -i "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getMe"
```
* Agar `HTTP/1.1 200 OK` chiqsa — token to'g'ri.
* Agar `401 Unauthorized` chiqsa — Telegram `@BotFather` dan yangi token olingan va uni Render Dashboard'da yangilash kerak.

### 3-qadam. Render serverining holatini tekshiring
```bash
curl -i "https://usmon-shashlik.onrender.com/api/health"
```
* Agar `{"status":"ok"}` chiqsa — Render uyg'oq va server ishlamoqda.
* Agar uzoq kutib javob bermasa — Render uxlab qolgan yoki qayta ishga tushmoqda.

### 4-qadam. Render Dashboard sozlamalarini tekshiring
* [dashboard.render.com](https://dashboard.render.com) ga kiring.
* `usmon-shashlik` → **Logs** bo'limida oxirgi xatoliklarni ko'ring.
* **Environment** bo'limida `TELEGRAM_BOT_TOKEN` to'g'ri kiritilganiga ishonch hosil qiling.

### 5-qadam. Bir vaqtda lokal kompyuterda botni yoqmang
* Agar Render'da bot ishlab turgan bo'lsa, lokal kompyuteringizda `start-backend.bat` ni yoqmang (yoki `.env` dagi bot tokenini o'chirib turing), aks holda `409 Polling Conflict` yuzaga keladi.
