@echo off
echo ==========================================
echo   ATRIQUET Frontend Server
echo ==========================================
echo.

cd frontend

echo Checking Node.js installation...
node --version
if %errorlevel% neq 0 (
    echo Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo Checking if node_modules exists...
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
) else (
    echo Dependencies already installed
)

echo.
echo Starting Next.js development server...
echo Frontend will be available at: http://localhost:3000
echo.

npm run dev

pause
