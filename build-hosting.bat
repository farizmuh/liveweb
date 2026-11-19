@echo off
set PATH=C:\Windows\System32;C:\Windows;C:\Windows\System32\WindowsPowerShell\v1.0;%PATH%
echo ========================================================
echo   Build Paket Hosting Siap Upload (deploy_hosting.zip)
echo ========================================================

cd /d "%~dp0"
node package-hosting.js

pause
