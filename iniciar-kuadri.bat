@echo off
start "MySQL" /min C:\xampp\mysql_start.bat
timeout /t 5 /nobreak
start "Kuadri API" cmd /k "cd /d %~dp0backend && npm run dev"
start "Kuadri Web" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 10 /nobreak
start http://localhost:5173
