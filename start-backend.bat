@echo off
echo ==========================================
echo   ATRIQUET Backend Server
echo ==========================================
echo.

cd backend

echo Checking Python installation...
D:\ATRIQUET\backend\venv\Scripts\python.exe --version
if %errorlevel% neq 0 (
    echo Python is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo Installing dependencies...
D:\ATRIQUET\backend\venv\Scripts\python.exe -m pip install -r requirements.txt

echo.
echo Starting FastAPI server...
echo Server will be available at: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo.

D:\ATRIQUET\backend\venv\Scripts\python.exe main.py

pause
