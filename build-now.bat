@echo off
cd /d "%~dp0"
set PATH=C:\Windows\System32;C:\Windows;C:\Windows\System32\WindowsPowerShell\v1.0;%PATH%
node package-hosting.js
pause
