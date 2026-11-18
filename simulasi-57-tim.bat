@echo off
cd /d "%~dp0"
set PATH=C:\Windows\System32;C:\Windows;C:\Windows\System32\WindowsPowerShell\v1.0;%PATH%
echo Menjalankan simulasi pembuatan bagan 57 tim di database MySQL lokal...
node simulate-57-teams.js
pause
