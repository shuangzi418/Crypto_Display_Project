@echo off
setlocal

set "ROOT=%~dp0"

start "CryptoQuiz Backend" cmd /k "cd /d "%ROOT%backend" && npm run dev"
start "CryptoQuiz Frontend" cmd /k "cd /d "%ROOT%frontend" && npm start"

echo Backend and frontend are starting...
echo Frontend: http://localhost:3001
echo Backend:  http://localhost:5000
