# 🌐 USMON SHASHLIK — Serverga O'rnatish va Butun Dunyoga Chiqarish Qo'llanmasi (Deployment Guide)

Ushbu qo'llanma orqali siz **USMON SHASHLIK** tizimini istalgan serverga o'rnatib, Telegram orqali barcha mijozlar va xodimlar uchun 24/7 rejimida ishlatishingiz mumkin.

---

## 🎯 4 xil o'rnatish usuli mavjud:

| Usul | Qachon ishlatiladi? | Qiyinlik darajasi | Xarajat |
|---|---|---|---|
| **1-Usul: Hoziroq telefonda sinash (Cloudflare / ngrok)** | Server olmasdan darhol botni o'z telefoningizda sinash | Juda oson (2 daqiqa) | Bepul |
| **2-Usul: Linux VPS Server (Ubuntu)** | Haqiqiy professional restoran biznesi uchun (Tavsiya etiladi) | Oson (skript bor) | $3 - $5/oy |
| **3-Usul: Docker Compose** | Zamonaviy konteynerlar orqali 1 buyruqda | Juda oson | Server narxi |
| **4-Usul: Cloud platformalar (Render / Railway)** | Server sozlamalarisiz bulutda ishlatish | O'rtacha | Bepul / $5 |

---

## 🚀 1-USUL: Server sotib olmasdan, hoziroq telefoningizda Telegram orqali sinash

Agar hozircha serveringiz bo'lmasa, kompyuteringizdagi loyihani internetga bepul chiqarib, telefoningizdagi Telegram orqali sinab ko'rishingiz mumkin:

### 1-qadam. Cloudflare Tunnel (Tavsiya etiladi, cheklovsiz va bepul):
1. [Cloudflare Tunnel (cloudflared.exe)](https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe) faylini yuklab oling.
2. Terminalda quyidagi buyruqni bering:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
3. U sizga tayyor `https://tasodifiy-nom.trycloudflare.com` manzilini beradi.

### 2-qadam. Yoki ngrok orqali:
```bash
ngrok http 3000
```
U sizga `https://sizning-manzil.ngrok-free.app` ko'rinishida HTTPS havola beradi.

### 3-qadam. Telegram Botga ulash:
1. Telegramda [@BotFather](https://t.me/BotFather) botiga kiring.
2. `/mybots` buyrug'ini yuboring va o'z botingizni tanlang.
3. **Bot Settings** → **Menu Button** → **Configure menu button**.
4. Yuqoridagi `https://...` havolani yuboring.
5. Tugma matniga: `🍢 Taom buyurtma qilish` deb yozing.
6. **Tayyor!** Telefoningizdan botga kirsangiz, pastda "Taom buyurtma qilish" tugmasi chiqadi va to'liq menyu ochiladi!

---

## 🖥 2-USUL: Linux VPS Serverga (Ubuntu 22.04 / 24.04) o'rnatish (Eng yaxshi usul)

Bu restoran uchun eng barqaror va professional usuldir. Istalgan VPS provayderidan (Hetzner, Vultr, DigitalOcean, Hostinger yoki O'zbekistondagi serverlardan) bitta minimal Ubuntu server olasiz (1 CPU, 2GB RAM yetarli).

### 1-qadam. Serverga ulanish:
Kompyuteringiz terminalidan serveringizga kiring:
```bash
ssh root@SERVERINGIZ_IP_MANZILI
```

### 2-qadam. Loyihani yuklash:
```bash
cd /var/www
git clone <LOYIHA_GITHUB_HAVOLASI> usmonshashlik
cd usmonshashlik
```

### 3-qadam. Avtomatlashtirilgan o'rnatish skriptini ishga tushirish:
Loyiha ichida maxsus tayyorlangan `deploy.sh` skripti bor:
```bash
chmod +x deploy.sh
./deploy.sh
```
Ushbu skript:
- Node.js 20, Nginx va PM2 ni o'rnatadi.
- Ma'lumotlar bazasini sozlaydi va to'ldiradi.
- Frontend dasturlarni ishlab chiqarish (production) rejimida yig'adi.
- Backendni 24/7 rejimida avtomatik ishga tushiradi (server o'chib yonsa ham o'zi yonadi).

### 4-qadam. Nginx va Domen ulash:
1. Tayyor Nginx faylini nusxalang:
   ```bash
   sudo cp nginx/server-nginx.conf /etc/nginx/sites-available/usmonshashlik
   sudo ln -s /etc/nginx/sites-available/usmonshashlik /etc/nginx/sites-enabled/
   ```
2. Faylni ochib o'z domeningizni yozing:
   ```bash
   sudo nano /etc/nginx/sites-available/usmonshashlik
   ```
   *(Masalan: `app.usmonshashlik.uz` va `admin.usmonshashlik.uz`)*
3. Nginx ni qayta yoqing:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### 5-qadam. Bepul SSL sertifikat (HTTPS) o'rnatish (Telegram uchun shart):
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d app.usmonshashlik.uz -d admin.usmonshashlik.uz
```
Bu buyruq 1 daqiqada rasmiy bepul SSL sertifikatini o'rnatib beradi.

---

## 🐳 3-USUL: Docker orqali 1 buyruqda o'rnatish

Agar serveringizda Docker o'rnatilgan bo'lsa, hamma narsa bitta buyruq bilan ko'tariladi:

```bash
docker compose up -d --build
```

Docker avtomatik tarzda:
- Backendni 5000-portda ishga tushiradi.
- Client (Mini App) ni 3000-portda ko'taradi.
- Admin Panelni 3001-portda ko'taradi.
- Nginx Gateway orqali 80-portda hammasini birlashtiradi.

Tekshirish:
```bash
docker compose ps
```

To'xtatish:
```bash
docker compose down
```

---

## 🔒 Xavfsizlik va Muhim Sozlamalar:

Serverga o'rnatgandan so'ng `backend/.env` faylida quyidagilarni to'ldiring:

```env
# Haqiqiy Telegram bot tokeningiz:
TELEGRAM_BOT_TOKEN="123456789:AAHxxxxx..."

# Xavfsiz sirli kalit:
JWT_SECRET="juda_uzun_va_maxfiy_kalit_yozing_2026"

# Admin parolini o'zgartirish:
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="SizningKuchsliParolingiz123"
```

Parolni o'zgartirgach, backendni yangilang:
- PM2 da: `pm2 restart usmon-backend`
- Docker da: `docker compose restart backend`
