@echo off
echo ========================================================
echo   Menginstall Dependencies (Root, Server, dan Client)
echo ========================================================

cd /d "%~dp0"

echo [1/3] Menginstall root dependencies...
call npm install

echo.
echo [2/3] Menginstall server dependencies...
cd server
call npm install

echo.
echo [3/3] Menginstall client dependencies...
cd ..\client
call npm install

cd ..
echo.
echo ========================================================
echo   Instalasi selesai!
echo   Langkah selanjutnya:
echo   1. Pastikan MySQL sudah berjalan (XAMPP / Laragon).
echo   2. Buat database: CREATE DATABASE esports_overlay;
echo   3. Jalankan setup-db.bat untuk migrasi dan seed data.
echo   4. Jalankan start-dev.bat untuk memulai aplikasi.
echo ========================================================
pause
