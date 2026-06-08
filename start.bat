@echo off
setlocal

echo.
echo  =============================================
echo   DWM Portal - Starting Production Server
echo  =============================================
echo.

:: Resolve absolute paths from script location
set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"

:: ── Pre-flight checks ──────────────────────────────────────────────

:: Check backend .env
if not exist "%BACKEND_DIR%\.env" (
    echo [ERROR] backend\.env not found!
    echo         Please create backend\.env before starting.
    pause
    exit /b 1
)

:: Check venv
if not exist "%BACKEND_DIR%\venv\Scripts\uvicorn.exe" (
    echo [ERROR] Python virtual environment not found or incomplete.
    echo         Please run: cd backend ^&^& python -m venv venv ^&^& venv\Scripts\pip install -r requirements.txt
    pause
    exit /b 1
)

:: ── Clear ports before starting (prevents WinError 10048) ─────────

echo [0/3] Clearing ports 58010 and 53005 (if in use)...

for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr " :58010 "') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr " :53005 "') do (
    taskkill /PID %%a /F >nul 2>&1
)

:: Brief pause to let OS release the ports
timeout /t 2 >nul

:: ── Start Backend ─────────────────────────────────────────────────

echo [1/3] Starting Backend (port 58010)...
cscript //nologo "%~dp0run_hidden.vbs" "\"%BACKEND_DIR%\\venv\\Scripts\\uvicorn.exe\"" app.main:app --host 0.0.0.0 --port 58010

:: Wait for backend to initialize before starting frontend
echo [2/3] Waiting 8 seconds for backend to initialize...
timeout /t 8 >nul

:: ── Start Frontend ────────────────────────────────────────────────

echo [3/3] Starting Frontend (port 53005)...

:: Build if no build folder exists
if not exist "%FRONTEND_DIR%\build\index.html" (
    echo       Build folder missing - running npm run build first...
    echo       This may take 3-5 minutes. Please wait.
    start "DWM Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm run build && npx -y serve -s build -l 53005 --no-clipboard"
) else (
    start "DWM Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npx -y serve -s build -l 53005 --no-clipboard"
)

:: ── Done ──────────────────────────────────────────────────────────

echo.
echo  =============================================
echo   DWM Portal is starting up!
echo  =============================================
echo.
echo   Frontend  :  http://192.168.5.22:53005
echo   Backend   :  http://192.168.5.22:58010
echo   API Docs  :  http://192.168.5.22:58010/docs
echo.
echo   Run stop.bat to shut down both servers.
echo.
exit