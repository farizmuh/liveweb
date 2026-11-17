@echo off
echo ========================================================
echo   Setup Database (Prisma DB Push & Seed)
echo ========================================================

cd /d "%~dp0server"

if not exist ".env" (
    echo [Peringatan] File .env belum ada. Menyalin dari .env.example...
    copy .env.example .env
)

echo.
echo [1/2] Membuat tabel database MySQL dengan Prisma...
call npx prisma db push

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Gagal menghubungkan ke MySQL!
    echo Pastikan MySQL (XAMPP/Laragon) aktif dan database 'esports_overlay' sudah dibuat.
    echo Periksa konfigurasi DATABASE_URL di file server/.env jika MySQL menggunakan password.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Mengisi data awal (Seeding 4 Meja, Tim MPL, Akun Wasit)...
call npm run prisma:seed

echo.
echo ========================================================
echo   Setup Database berhasil!
echo   Sekarang Anda bisa menjalankan start-dev.bat
echo ========================================================
pause
