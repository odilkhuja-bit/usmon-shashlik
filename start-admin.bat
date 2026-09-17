@echo off
title USMON SHASHLIK - Admin Dashboard
echo ============================================
echo   USMON SHASHLIK - Admin Dashboard (:3001)
echo ============================================
cd admin
if not exist node_modules (
  echo [1/2] Paketlar o'rnatilmoqda...
  call npm install
)
echo [2/2] Admin Dashboard ishga tushirilmoqda...
npm run dev
pause
