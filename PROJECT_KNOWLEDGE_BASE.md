# 🍢 USMON SHASHLIK — To'liq Loyiha Ma'lumotnomasi va Xotira Bazasisi (Knowledge Base)

> **Ushbu fayl nima uchun?**  
> Loyihani yopib, yangi ish boshlanganda va kelajakda yana ushbu loyihaga qaytib kelinganda — yangi AI agent yoki dasturchi hamma narsani 0 dan tushunishi, chalkashmasligi va har qanday muammoni darhol hal qilishi uchun barcha jarayonlar shu yerda jamlangan.

---

## 📌 1. Loyiha haqida umumiy ma'lumot

* **Loyiha nomi:** USMON SHASHLIK
* **Vazifasi:** Shashlikxona uchun Telegram Mini App, buyurtmalar boshqaruvi va Admin Panel.
* **Texnologiyalar:**
  * **Backend:** Node.js, Express, Socket.IO (real-time xabarlar), Prisma ORM.
  * **Frontend (Client Mini App):** React 18, Vite, Tailwind/Vanilla CSS, Telegram WebApp SDK.
  * **Admin Panel:** React 18, Vite, Real-time audio bildirishnomalar.
  * **Ma'lumotlar bazasi:** PostgreSQL (Render.com).
* **Asosiy havolalar:**
  * **Jonli sayt & Mini App:** `https://usmon-shashlik.onrender.com`
  * **Admin Panel:** `https://usmon-shashlik.onrender.com/admin`
  * **Health Check API:** `https://usmon-shashlik.onrender.com/api/health`
  * **GitHub Repozitoriya:** `https://github.com/odilkhuja-bit/usmon-shashlik` (Branch: `master`)

---

## 🔑 2. Muhim Kalitlar va Kirish Ma'lumotlari

| Xizmat | Ma'lumot | Qayerda saqlanadi |
| :--- | :--- | :--- |
| **Telegram Bot** | `@usmonshashlik_bot` (ID: `8986986202`) | Token: `backend/.env` va Render Dashboard |
| **Admin Panel Logini** | `admin` | Render Environment / Seed |
| **Admin Panel Paroli** | `admin123` | Render Environment / Seed |
| **Admin Telegram Guruhi** | `-5268825215` | `backend/.env` (`ADMIN_CHAT_ID`) |
| **Render Baza Manzili** | Yangi `usmon-shashlik-db` Internal URL | Render Dashboard -> `DATABASE_URL` |

> ⚠️ **Qat'iy Xavfsizlik Qoidasi:** Telegram bot tokenini HECH QACHON ochiq holda GitHub repozitoriyasiga push qilmang! Telegram GitHub'ni skanerlab, ochiq tokenlarni avtomatik bloklaydi. Barcha tokenlar faqat `.env` va Render Dashboard'da bo'lishi shart!

---

## 🚨 3. Yuzaga Kelgan Muammolar va Ularning Yechimlari (Incident History)

### 1-muammo: Render bepul tarifida bot uxlab qolishi (Sleep / Spin-down)
* **Sabab:** Render Free Web Service'ga 15 daqiqa HTTP so'rov kelmasa, server o'chadi. Telegram bot polling rejimida bo'lgani uchun bot ham birga o'chib qolgan.
* **Yechilgan:**
  1. `.github/workflows/keep-alive.yml` orqali GitHub Actions har 10 daqiqada `/api/health` ga ping yuboradi (kompyuter o'chiq bo'lsa ham ishlaydi).
  2. `backend/src/index.js` da server o'zini o'zi har 10 daqiqada uyg'otib turuvchi taymer bor.
  3. Lokal kompyuterda `start-pinger.bat` skripti mavjud.

### 2-muammo: Telegram Mini App WebApp HTTPS talabi va Node.js Crash
* **Sabab:** Telegram inline tugmasidagi `web_app` havolasi faqat `https://` bo'lishi shart. `http://` bo'lsa bot API xatolik berib, Node.js server to'xtab qolgan.
* **Yechilgan:** `backend/src/core/bot.js` da URL majburiy tekshirilib, doimo `https://usmon-shashlik.onrender.com` ga yo'naltiriladi va butun bot chaqiruvlari `try/catch` va global error handlerlar bilan himoyalandi.

### 3-muammo: Polling mojarosi (409 Conflict)
* **Sabab:** Render'da bot ishlab turgan paytda lokal kompyuterda ham `start-backend.bat` yoqilsa, bitta token bilan 2 joyda polling bo'lib, bot uzilib qoladi.
* **Qoida:** Render'da ishlab turganda lokal kompyuterda bir vaqtda backendni yoqmaslik kerak.

### 4-muammo: Eski botning bloklanishi va yangi bot yaratilishi
* **Sabab:** Avvalgi bot tokeni ochiq repo skanerlariga tushib, spamerlar tomonidan deface qilingan va Telegram botni butunlay o'chirib yuborgan («Удалённый аккаунт»).
* **Yechilgan:** `@BotFather` da yangi toza bot yaratildi: ID: `8986986202`, Username: `@usmonshashlik_bot`.

### 5-muammo: Render Free PostgreSQL 30-kunlik muddati va P1001 xatoligi
* **Sabab:** Render bepul PostgreSQL bazasi har 30 kunda avtomatik to'xtaydi («Suspended by Render»). Deploy vaqtida `P1001: Can't reach database server` xatosi chiqadi.
* **Yechilgan:** Eski baza o'chirilib, yangi `usmon-shashlik-db` ochildi va uning `Internal Database URL` manzili `usmon-shashlik` -> Environment bo'limiga kiritildi. Barcha taomlar va filiallar `prisma/seed.js` orqali avtomatik tiklandi.

---

## 🛠️ 4. Kelajakda Muammo Bo'lsa — 2 Daqiqalik Tezkor Qo'llanma

Agar kelajakda ushbu loyihaga qaytganingizda bot ishlamayotgan bo'lsa, quyidagi 3 qadamni bajaring:

### 1-qadam. Render PostgreSQL bazasini tekshiring (Har 30 kunda!):
1. [dashboard.render.com](https://dashboard.render.com) ga kiring.
2. Agar **`usmon-shashlik-db`** yonida qizil **`Suspended by Render`** yozuvi tursa:
   * Uni o'chiring (**Settings** -> **Delete Database**).
   * Yangi baza oching: **`+ New`** -> **PostgreSQL** -> Name: `usmon-shashlik-db`, Plan: `Free`.
   * Yangi bazaning **Internal Database URL** manzilini nusxalang.
   * **`usmon-shashlik`** (Web Service) -> **Environment** bo'limidagi **`DATABASE_URL`** ga qo'yib, **Save Changes** ni bosing.
   *(Taomlar, menyu, filiallar avtomatik `seed.js` orqali yangi bazaga yuklanadi!)*

### 2-qadam. Server salomatligini tekshirish:
Brauzerda yoki terminalda tekshiring:
```bash
curl -i "https://usmon-shashlik.onrender.com/api/health"
```
* Agar `{"status":"ok"}` chiqsa — server 100% uyg'oq va ishlamoqda.

### 3-qadam. Bot holatini tekshirish:
Telegramda `@usmonshashlik_bot` ga **/start** yuboring.
Mini App menyusi chiqishi kerak. Agar chiqmasa, BotFather'da `/setmenubutton` orqali havola `https://usmon-shashlik.onrender.com` qilib o'rnatilganini tekshiring.

---

## 📁 5. Loyiha Papkalari Strukturasi

* **`backend/`** — Node.js Express server, Socket.io, Telegram bot (`src/core/bot.js`), Prisma ORM (`prisma/schema.prisma`).
* **`client/`** — Mijozlar uchun Telegram Mini App (React + Vite).
* **`admin/`** — Buyurtmalarni boshqarish paneli (React + Vite).
* **`render-build.sh`** va **`render-start.sh`** — Render avtomatlashtirilgan yig'ish va ishga tushirish skriptlari.
* **`render.yaml`** — Render Blueprint konfiguratsiyasi (`sync: false` bilan xavfsizlangan).
* **`AGENTS.md`** — AI agentlar uchun tezkor kontekst hujjati.
* **`TROUBLESHOOTING_AND_MAINTENANCE.md`** — Nosozliklarni bartaraf qilish hujjati.
