@echo off
echo ==========================================
echo   ATRIQUET Backend Server
echo ==========================================
echo.

cd backend

if exist "..\.env" (
    for /f "usebackq tokens=1,* delims==" %%A in ("..\.env") do (
        if /I "%%A"=="GEMINI_API_KEY" set "GEMINI_API_KEY=%%B"
        if /I "%%A"=="GROQ_API_KEY" set "GROQ_API_KEY=%%B"
    )
)
if defined GEMINI_API_KEY set "GOOGLE_API_KEY=%GEMINI_API_KEY%"

set "PYTHON_EXE=%CD%\venv311\Scripts\python.exe"
if not exist "%PYTHON_EXE%" (
    set "PYTHON_EXE=%CD%\venv\Scripts\python.exe"
)

echo Checking Python installation...
"%PYTHON_EXE%" --version
if %errorlevel% neq 0 (
    echo Python virtual environment not found.
    echo Expected one of these paths:
    echo   %CD%\venv311\Scripts\python.exe
    echo   %CD%\venv\Scripts\python.exe
    pause
    exit /b 1
)

echo.
echo Installing dependencies...
"%PYTHON_EXE%" -m pip install -r requirements.txt

echo.
echo Starting FastAPI server...
echo Server will be available at: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo.

"%PYTHON_EXE%" main.py

pause
