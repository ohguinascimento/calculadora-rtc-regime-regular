@echo off
echo =======================================================
echo Iniciando Sistema de Precificacao RTC - Fabrica de Meias
echo =======================================================
echo.
cd /d "%~dp0\frontend"
echo Iniciando servidor Frontend React (Vite)...
npm run dev
pause
