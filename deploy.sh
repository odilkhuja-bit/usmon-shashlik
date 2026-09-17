#!/bin/bash
# ========================================================
# USMON SHASHLIK — Ubuntu/Debian Server Avtomatik O'rnatish
# ========================================================

set -e

echo "🍢 USMON SHASHLIK tizimini serverga o'rnatish boshlandi..."

# 1. Yangilanishlarni tekshirish
echo "[1/6] Tizim yangilanmoqda..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx build-essential

# 2. Node.js 20 LTS o'rnatish
if ! command -v node &> /dev/null; then
    echo "[2/6] Node.js 20 o'rnatilmoqda..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# 3. PM2 o'rnatish
if ! command -v pm2 &> /dev/null; then
    echo "[3/6] PM2 o'rnatilmoqda..."
    sudo npm install -g pm2
fi

# 4. Backendni sozlash
echo "[4/6] Backend kutubxonalari o'rnatilmoqda..."
cd backend
npm ci
npx prisma generate
npx prisma db push
node prisma/seed.js
cd ..

# 5. Client va Admin ni build qilish
echo "[5/6] Frontend dasturlar yig'ilmoqda (build)..."
cd client
npm ci
npm run build
cd ../admin
npm ci
npm run build
cd ..

# 6. PM2 orqali backendni ishga tushirish
echo "[6/6] Backend server 24/7 rejimida yoqilmoqda..."
pm2 start ecosystem.config.js || pm2 restart ecosystem.config.js
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

echo ""
echo "========================================================"
echo "✅ USMON SHASHLIK serverga muvaffaqiyatli o'rnatildi!"
echo "========================================================"
echo "Backend port: 5000"
echo "Client papkasi: $(pwd)/client/dist"
echo "Admin papkasi:  $(pwd)/admin/dist"
echo ""
