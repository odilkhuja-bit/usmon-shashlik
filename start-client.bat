@echo off
title USMON SHASHLIK - Client Mini App
echo ============================================
echo   USMON SHASHLIK - Client Mini App (:3000)
echo ============================================
cd client
if not exist node_modules (
  echo [1/2] Paketlar o'rnatilmoqda...
  call npm install
)
echo [2/2] Client Mini App ishga tushirilmoqda...
npm run dev
pause
