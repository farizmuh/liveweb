@echo off
echo ========================================================
echo   Menjalankan Esports Overlay (Backend & Frontend)
echo ========================================================

cd /d "%~dp0"

echo Menjalankan Backend Server di Port 3000...
start "Esports Backend (Port 3000)" cmd /k "cd server && npm run dev"

timeout /t 2 /nobreak >nul

echo Menjalankan Frontend Client di Port 5173...
start "Esports Frontend (Port 5173)" cmd /k "cd client && npm run dev"

echo.
echo ========================================================
echo   Aplikasi sedang berjalan!
echo.
echo   - Admin Panel Wasit:   http://localhost:5173/admin
echo   - Bagan Turnamen:      http://localhost:5173/bracket
echo   - Overlay OBS:         http://localhost:5173/overlay
echo.
echo   Login Default:
echo   - Superadmin: admin / admin123
echo   - Wasit 1..4: wasit1 / wasit123
echo ========================================================
pause
