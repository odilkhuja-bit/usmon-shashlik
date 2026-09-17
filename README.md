# 🍢 USMON SHASHLIK — Telegram Mini App + Admin Panel + Node.js Backend

Professional, to'liq ishlaydigan va production-ready restoran buyurtma tizimi: **Telegram Mini App**, **SaaS Admin Dashboard** va **Node.js Express Backend**.

---

## 📑 Mundarija

1. [Loyiha tuzilishi](#-loyiha-tuzilishi)
2. [Texnologiyalar](#-texnologiyalar)
3. [Ishga tushirish (Tezkor qo'llanma)](#-ishga-tushirish-tezkor-qollanma)
4. [PostgreSQL o'rnatish va sozlash](#-postgresql-ornatish-va-sozlash)
5. [Telegram Bot va Mini App ulash](#-telegram-bot-va-mini-app-ulash)
6. [Admin Panel ma'lumotlari](#-admin-panel-malumotlari)
7. [Foydalanish bo'yicha yo'riqnoma](#-foydalanish-boyicha-yoriqnoma)

---

## 📁 Loyiha tuzilishi

```
usmonshashlik/
├── backend/                  # Node.js Express REST API + Socket.IO + Telegram Bot
│   ├── src/
│   │   ├── config/           # Konfiguratsiyalar
│   │   ├── controllers/      # 9 ta controller (buyurtmalar, mahsulotlar, tahlil...)
│   │   ├── core/             # Telegram Bot mantiqi
│   │   ├── middlewares/      # JWT, Telegram initData, Error handler
│   │   ├── routes/           # Admin, Client, Order routelari
│   │   ├── services/         # Order, Broadcast, Telegram, Notification
│   │   ├── utils/            # Logger, yordamchi funksiyalar
│   │   └── index.js          # Asosiy server fayli (:5000)
│   ├── prisma/
│   │   ├── schema.prisma     # 8 ta model, enumlar, aloqalar
│   │   └── seed.js           # Boshlang'ich ma'lumotlar (filiallar, taomlar, admin)
│   ├── .env                  # Muhit o'zgaruvchilari
│   └── package.json
│
├── client/                   # Telegram Mini App (Mijozlar uchun mobil ilova)
│   ├── src/
│   │   ├── components/       # BottomNav, ProductSheet
│   │   ├── context/          # AppContext, CartContext, ToastContext
│   │   ├── pages/            # Onboarding, BranchSelect, Home, Menu, Cart, Checkout, OrderSuccess, Profile, Orders, Favorites
│   │   ├── services/         # Axios API qatlami + Telegram initData
│   │   ├── utils/            # i18n (UZ/RU), Telegram WebApp SDK, helpers
│   │   ├── index.css         # Premium mobil dizayn tizimi
│   │   ├── App.jsx           # Router va navigatsiya
│   │   └── main.jsx          # Entry point (:3000)
│   ├── index.html
│   └── package.json
│
├── admin/                    # Professional Desktop Admin Dashboard (Menejerlar uchun)
│   ├── src/
│   │   ├── components/       # Layout, StatusBadge, Modal
│   │   ├── context/          # AuthContext, ToastContext
│   │   ├── pages/            # Dashboard, Orders, Products, Categories, Branches, Users, Broadcast, Analytics, Admins, Settings, Login
│   │   ├── services/         # Admin API + Socket.IO real-vaqt
│   │   ├── utils/            # i18n, helpers (sound, format)
│   │   ├── index.css         # Clean SaaS dizayn tizimi
│   │   ├── App.jsx           # Himoyalangan yo'nalishlar
│   │   └── main.jsx          # Entry point (:3001)
│   ├── index.html
│   └── package.json
│
├── start-all.bat             # Barcha 3 tizimni bir bosishda ishga tushiruvchi skript
├── start-backend.bat         # Faqat backendni ishga tushirish
├── start-client.bat          # Faqat clientni ishga tushirish
├── start-admin.bat           # Faqat adminni ishga tushirish
└── package.json
```

---

## 🛠 Texnologiyalar

| Qism | Texnologiya |
|---|---|
| **Backend** | Node.js, Express, Prisma ORM, PostgreSQL, Socket.IO, JWT, bcryptjs, winston |
| **Telegram** | node-telegram-bot-api, WebApp initData HMAC-SHA256 tekshiruvi |
| **Client** | React 18, Vite, React Router 7, Axios, Telegram WebApp SDK |
| **Admin Panel** | React 18, Vite, React Router 7, Axios, Socket.IO Client, Pure CSS SaaS UI |
| **Dizayn** | Inter font, Rich animations, Micro-interactions, Warm Amber brand palette |

---

## 🚀 Ishga tushirish (Tezkor qo'llanma)

### 1-usul: Bir bosishda (Tavsiya etiladi - Windows)

1. Loyiha papkasidagi **`start-all.bat`** faylini sichqoncha bilan 2 marta bosing.
2. Skript avtomatik ravishda barcha kerakli paketlarni o'rnatadi va 3 ta alohida oynada ishga tushiradi:
   - **Backend API:** `http://localhost:5000`
   - **Client Mini App:** `http://localhost:3000`
   - **Admin Dashboard:** `http://localhost:3001`

---

### 2-usul: Buyruqlar paneli (Terminal) orqali

#### 1. Backendni ishga tushirish:
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

#### 2. Client (Mini App) ni ishga tushirish (yangi terminalda):
```bash
cd client
npm install
npm run dev
```

#### 3. Admin Panelni ishga tushirish (yangi terminalda):
```bash
cd admin
npm install
npm run dev
```

---

## 💾 Ma'lumotlar bazasi (Zero-setup — O'rnatish talab qilinmaydi!)

Loyiha uchun **nol-sozlash (zero-setup)** tizimi joriy qilingan:
- Ma'lumotlar bazasi sifatida avtomatik **SQLite** (`backend/prisma/dev.db`) ishlatiladi.
- Kompyuteringizga hech qanday PostgreSQL yoki boshqa dastur o'rnatishingiz shart emas!
- Barcha modellar, 2 ta filial, 5 ta kategoriya, 16 ta taom va `admin` foydalanuvchisi avtomatik tarzda yaratilgan va darhol foydalanishga tayyor!

---

## 🤖 Telegram Bot va Mini App ulash

1. Telegramda [@BotFather](https://t.me/BotFather) botiga kiring.
2. `/newbot` buyrug'ini yuboring va botingiz nomini kiriting (masalan: `Usmon Shashlik`).
3. BotFather bergan **HTTP API Token** ni nusxalang va `backend/.env` faylidagi `TELEGRAM_BOT_TOKEN` maydoniga yozing:
```env
TELEGRAM_BOT_TOKEN="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
```

### Mini App (Web App) tugmasini sozlash:
1. Sinov uchun `ngrok` orqali localhost portingizni internetga chiqaring:
```bash
ngrok http 3000
```
*(ngrok bergan `https://....ngrok-free.app` manzilini oling)*
2. [@BotFather](https://t.me/BotFather) da:
   - `/mybots` → O'z botingizni tanlang.
   - **Bot Settings** → **Menu Button** → **Configure menu button**.
   - Tugma URL manzili sifatida yuqoridagi https manzilni yuboring.
   - Tugma matni: `🍢 Taom buyurtma qilish`.
3. Endi botingizga kirsangiz, pastki chap burchakda **Taom buyurtma qilish** tugmasi paydo bo'ladi!

---

## 🔑 Admin Panel ma'lumotlari

Admin panelga kirish: **`http://localhost:3001`**

- **Login:** `admin`
- **Parol:** `admin123`
- **Roli:** `SUPER_ADMIN` (Barcha huquqlarga ega)

### Admin panel imkoniyatlari:
- 📊 **Dashboard:** Bugungi tushum, faol buyurtmalar, oylik/haftalik tushum grafigi, eng ko'p sotilgan taomlar.
- 🛍️ **Buyurtmalar:** Real vaqtda yangi buyurtmalar kelishi (ovozli bildirishnoma + qizil belgi), statuslarni o'zgartirish (Yangi → Tasdiqlandi → Tayyorlanmoqda → Tayyor → Yetkazilmoqda → Bajarildi).
- 🍢 **Mahsulotlar:** Yangi taom qo'shish, narxlarni o'zgartirish, sotuvdan vaqtincha olish, o'chirish va qayta tiklash.
- 📂 **Kategoriyalar:** Taom turlarini boshqarish (Shashliklar, Salatlar, Ichimliklar va h.k.).
- 📍 **Filiallar:** Filiallarni boshqarish, xaritadagi koordinatalar, telefon va ish vaqtlari.
- 👥 **Mijozlar:** Ro'yxatdan o'tgan mijozlar, ularning buyurtmalari soni, bloklash/blokdan chiqarish, CSV yuklab olish.
- 📢 **Broadcast:** Barcha mijozlarga yoki filial bo'yicha Telegram orqali aksiya/reklama xabarlarini ommaviy yuborish.
- 📈 **Statistika & Tahlil:** 7, 14, 30 kunlik tushumlar tahlili, filiallar ko'rsatkichlari.
- 🛡️ **Adminlar:** Yangi filial menejerlari yoki operatorlarni qo'shish va huquqlarini taqsimlash.
- ⚙️ **Sozlamalar:** Minimal buyurtma summasi, yetkazib berish narxi, ish vaqti va parolni o'zgartirish.

---

## 🌟 Foydalanuvchi interfeysi (Mini App) xususiyatlari

- **Ikki tilda:** O'zbekcha 🇺🇿 va Ruscha 🇷🇺 to'liq qo'llab-quvvatlash.
- **Onboarding:** Yangi foydalanuvchilar uchun 3 bosqichli tanishtiruv slayderi.
- **Eng yaqin filialni aniqlash:** Geolocation orqali foydalanuvchiga eng yaqin filialni masofasini (km) hisoblab avtomatik tavsiya etish.
- **Interaktiv menyu:** Kategoriyalar bo'yicha tezkor filtr, qidiruv, rasmlar, aksiyali eski narxlar.
- **Product Bottom Sheet:** Taom tarkibi, sonini tanlash va savatga qo'shish.
- **Aqlli savatcha (Cart):** Narx hisoblash, yetkazib berish narxini qo'shish, tavsiya etiluvchi qo'shimchalar (Upsell).
- **Buyurtma berish (Checkout):** 3 xil usul (Yetkazib berish, Olib ketish, Restoranda), manzil va izoh kiritish.
- **Sevimlilar:** Yoqtirgan taomlarni yurakcha orqali saqlash.
- **Buyurtmalar tarixi & Qayta buyurtma:** O'tgan buyurtmalarni ko'rish va bir bosishda qayta buyurtma berish.
- **Haptic Feedback:** Telegram ilovasidagi tebranish effekti (tugmalar bosilganda).

---

© **USMON SHASHLIK** — Barcha huquqlar himoyalangan.
