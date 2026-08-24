@echo off
title Club Growth Center - Start
echo ============================================
echo   Club Growth Center - one-click start
echo   Please run this from the repo root folder.
echo ============================================
echo.
echo Opening 3 service windows...
echo NOTE: keep these 3 windows OPEN while using the site.
echo.

set "BASE=%~dp0"

echo [1/3] Archive backend  FastAPI on port 8000
start "1-ArchiveAPI8000" cmd /k "cd /d %BASE%AIClub_database-main\backend && pip install -r requirements.txt -q && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

echo [2/3] AI assistant  Node on port 3000
start "2-AI3000" cmd /k "cd /d %BASE%AI+club\AI+club && node server.js"

echo [3/3] Platform frontend  Vite on port 5173
start "3-Web5173" cmd /k "cd /d %BASE% && npm install && npm run dev"

echo.
echo All 3 windows opened. Wait for the addresses to appear.
echo   Local access:  http://localhost:5173
echo   LAN access:    http://YOUR-LAN-IP:5173   (same campus wifi)
echo.
echo If the AI window says "Missing DEEPSEEK_API_KEY":
echo   copy AI+club\AI+club\.env.example to .env and add your DeepSeek key.
echo.
echo You can close THIS window. Keep the 3 service windows open.
ping -n 8 127.0.0.1 >nul
exit
