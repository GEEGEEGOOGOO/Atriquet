@echo off
echo ==========================================
echo   ATRIQUET - Starting All Services
echo ==========================================
echo.

echo Starting Backend Server...
start cmd /k "cd /d %~dp0 && start-backend.bat"

timeout /t 5 /nobreak >nul

echo Starting Frontend Server...
start cmd /k "cd /d %~dp0 && start-frontend.bat"

echo.
echo ==========================================
echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo ==========================================
echo.
pause
