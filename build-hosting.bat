@echo off
echo ========================================================
echo   Build Paket Hosting Siap Upload (Tanpa npm install di server)
echo ========================================================

cd /d "%~dp0"
node package-hosting.js

pause
