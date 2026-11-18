@echo off
cd /d "%~dp0\client"
set PATH=C:\Windows\System32;C:\Windows;C:\Windows\System32\WindowsPowerShell\v1.0;%PATH%
echo ========================================================
echo 🔨 MENGOMPILASI FRONTEND TERBARU KE DIST...
echo ========================================================
npm run build
echo ========================================================
echo ✅ SELESAI! Silakan refresh OBS Browser Source Anda.
echo ========================================================
pause
