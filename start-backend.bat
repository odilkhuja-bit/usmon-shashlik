@echo off
title USMON SHASHLIK - Backend Server
echo ============================================
echo   USMON SHASHLIK - Backend Server (:5000)
echo ============================================
cd backend
if not exist node_modules (
  echo [1/3] Paketlar o'rnatilmoqda...
  call npm install
)
if not exist prisma\dev.db (
  echo [2/3] Baza yaratilmoqda va boshlang'ich ma'lumotlar yuklanmoqda...
  call npx prisma db push
  call node prisma/seed.js
) else (
  echo [2/3] Prisma Client tekshirilmoqda...
  call npx prisma generate
)
echo [3/3] Backend server ishga tushirilmoqda...
npm run dev
pause
