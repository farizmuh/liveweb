@echo off
set PATH=C:\Windows\System32;C:\Windows;C:\Windows\System32\WindowsPowerShell\v1.0;%PATH%
cd /d "%~dp0"
echo ========================================================
echo 🚀 UPDATE ESPORTS OVERLAY (DATABASE & FRONTEND)
echo ========================================================

echo [1/3] Menyesuaikan skema database (Prisma db push)...
cd /d "%~dp0\server"
call npx prisma db push
call npx prisma generate

echo [2/3] Mengompilasi frontend client terbaru...
cd /d "%~dp0\client"
call npm run build

echo [3/3] Mengompilasi backend server...
cd /d "%~dp0\server"
call npm run build

cd /d "%~dp0"
echo ========================================================
echo ✅ SELESAI! Database & Frontend telah diperbarui.
echo Silakan refresh browser OBS / halaman web Anda.
echo ========================================================
pause
