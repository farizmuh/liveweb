@echo off
set PATH=C:\Windows\System32;C:\Windows;C:\Windows\System32\WindowsPowerShell\v1.0;%PATH%
cd /d "%~dp0\server"
echo ========================================================
echo 🗄️ MENYESUAIKAN TABEL DATABASE (PRISMA DB PUSH)...
echo ========================================================
call npx prisma db push
call npx prisma generate
echo ========================================================
echo ✅ DATABASE BERHASIL DIUPDATE!
echo Jangan lupa restart terminal server Anda jika sedang berjalan.
echo ========================================================
pause
