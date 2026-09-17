@echo off
title USMON SHASHLIK - Barcha xizmatlarni ishga tushirish
echo ========================================================
echo   USMON SHASHLIK - To'liq tizimni ishga tushirish
echo ========================================================
echo.
echo 1. Backend server ishga tushirilmoqda (:5000)...
start "Backend :5000" call start-backend.bat
timeout /t 3 /nobreak >nul

echo 2. Client Mini App ishga tushirilmoqda (:3000)...
start "Client :3000" call start-client.bat
timeout /t 2 /nobreak >nul

echo 3. Admin Panel ishga tushirilmoqda (:3001)...
start "Admin :3001" call start-admin.bat

echo.
echo ========================================================
echo   Tizimlar alohida oynalarda ishga tushirildi!
echo   - Backend:  http://localhost:5000
echo   - Client:   http://localhost:3000
echo   - Admin:    http://localhost:3001
echo ========================================================
echo.
pause
