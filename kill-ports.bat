@echo off
set PATH=C:\Windows\System32;C:\Windows;%PATH%
echo ========================================================
echo 🧹 MEMBERSIHKAN PORT 3000 & 5173 YANG MENYANGKUT...
echo ========================================================

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo Menghentikan proses di Port 3000 (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    echo Menghentikan proses di Port 5173 (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo ========================================================
echo ✅ Port 3000 dan 5173 berhasil dibebaskan!
echo Anda sekarang bisa menjalankan "npm run dev" kembali.
echo ========================================================
pause
