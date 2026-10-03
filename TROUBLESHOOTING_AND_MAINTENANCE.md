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

### 2-sabab: Telegram Bot Tokeni nomutanosibligi (401 Unauthorized)
Ikkita turli token mavjud edi:
1. `8832100007:AAHjZpn6CKLPgPHPnzUAnRsJR9rqRpTjz8g` (`render.yaml` faylida va Render Dashboard'da o'rnatilgan edi).
2. `8832100007:AAEucfq-mUrzMPEzhdll72BjvH1WUqYa3g0` (`backend/.env` faylida turgan edi).

**Tekshiruv buyruqlari va Telegram javoblari:**
```bash
# 1-token tekshiruvi:
curl -i "https://api.telegram.org/bot8832100007:AAHjZpn6CKLPgPHPnzUAnRsJR9rqRpTjz8g/getMe"
# Javob: HTTP/1.1 401 Unauthorized {"ok":false,"error_code":401,"description":"Unauthorized"}

# 2-token tekshiruvi:
curl -i "https://api.telegram.org/bot8832100007:AAEucfq-mUrzMPEzhdll72BjvH1WUqYa3g0/getMe"
# Javob: HTTP/1.1 200 OK {"ok":true,"result":{"id":8832100007,"username":"usmonshashlik_bot"}}
```
**Xulosa:** `AAHj...` tokeni bekor qilingan (eskirgan). Haqiqiy ishlayotgan token — `AAEucfq-mUrzMPEzhdll72BjvH1WUqYa3g0`.

### 3-sabab: Mini App URL xatosi va Node.js halokati (Crash)
* `bot.js` faylidagi `sendMenu` inline tugmasiga Mini App URL sifatida `http://localhost:3000` ketib qolgan.
* Telegram Bot API esa `web_app` havolasi uchun **faqat HTTPS** linklarni qabul qiladi.
* Telegram `400 Bad Request` xatosini qaytargan, va chaqiruv `try/catch` va `await` qilinmagani sababli Node.js jarayoni butunlay crash bo'lib o'chgan.

### 4-sabab: Polling mojarosi (409 Conflict)
* Agar Render'da bot ishlab turgan paytda, bir vaqtning o'zida lokal kompyuterda ham `start-backend.bat` ishga tushirilsa, bitta token bilan ikkita joyda Telegramdan xabar olishga urinish bo'ladi.
* Natijada Telegram `409 Conflict: terminated by other getUpdates request` berib, ikkala tomonni ham uzib tashlaydi.

---

## 🛠️ 3. Amalga Oshirilgan Yechimlar

### 1. `render.yaml` to'g'rilandi:
`render.yaml` faylidagi `TELEGRAM_BOT_TOKEN` qiymati yangi, haqiqiy tokenga almashtirildi:
```yaml
- key: TELEGRAM_BOT_TOKEN
  value: 8832100007:AAEucfq-mUrzMPEzhdll72BjvH1WUqYa3g0
```

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

---

## 🚨 4. Kelajakda Muammo Bo'lsa — Tezkor Qadamlar (Checklist)

Agar qachondir bot ishlamay qolsa, quyidagi ketma-ketlikda 2 daqiqada tekshiring:

### 1-qadam. Telegram tokenini tekshiring
Terminalda buyruq bering:
```bash
curl -i "https://api.telegram.org/bot8832100007:AAEucfq-mUrzMPEzhdll72BjvH1WUqYa3g0/getMe"
```
* Agar `HTTP/1.1 200 OK` chiqsa — token to'g'ri.
* Agar `401 Unauthorized` chiqsa — Telegram `@BotFather` dan yangi token olingan va uni Render Dashboard'da yangilash kerak.

### 2-qadam. Render serverining holatini tekshiring
```bash
curl -i "https://usmon-shashlik.onrender.com/api/health"
```
* Agar `{"status":"ok"}` chiqsa — Render uyg'oq va server ishlamoqda.
* Agar uzoq kutib javob bermasa — Render uxlab qolgan yoki qayta ishga tushmoqda.

### 3-qadam. Render Dashboard sozlamalarini tekshiring
* [dashboard.render.com](https://dashboard.render.com) ga kiring.
* `usmon-shashlik` → **Logs** bo'limida oxirgi xatoliklarni ko'ring.
* **Environment** bo'limida `TELEGRAM_BOT_TOKEN` qiymati `8832100007:AAEucfq-mUrzMPEzhdll72BjvH1WUqYa3g0` ekanligiga ishonch hosil qiling.

### 4-qadam. Bir vaqtda lokal kompyuterda botni yoqmang
* Agar Render'da bot ishlab turgan bo'lsa, lokal kompyuteringizda `start-backend.bat` ni yoqmang (yoki `.env` dagi bot tokenini o'chirib turing), aks holda `409 Polling Conflict` yuzaga keladi.
