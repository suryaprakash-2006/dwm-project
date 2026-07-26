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
    if exist "%BACKEND_DIR%\.env.example" (
        copy "%BACKEND_DIR%\.env.example" "%BACKEND_DIR%\.env" >nul
        echo [INFO] Created backend\.env from backend\.env.example
    ) else (
        echo [ERROR] backend\.env not found!
        echo         Please create backend\.env before starting.
        pause
        exit /b 1
    )
)

:: Check venv
if not exist "%BACKEND_DIR%\dwmvenv\Scripts\uvicorn.exe" (
    echo [ERROR] Python virtual environment not found or incomplete.
    echo         Please run: cd backend ^&^& python -m venv dwmvenv ^&^& dwmvenv\Scripts\pip install -r requirements.txt
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
cscript //nologo "%~dp0run_hidden.vbs" cmd.exe /c cd /d "%BACKEND_DIR%" ^&^& "%BACKEND_DIR%\dwmvenv\Scripts\uvicorn.exe" app.main:app --host 0.0.0.0 --port 58010 --lifespan off

:: Wait for backend to initialize before starting frontend
echo [2/3] Waiting 8 seconds for backend to initialize...
timeout /t 8 >nul

:: ── Start Frontend ────────────────────────────────────────────────

echo [3/3] Starting/Building Frontend (port 53005)...

:: Ensure frontend dependencies are installed locally
if not exist "%FRONTEND_DIR%\node_modules\react-scripts\bin\react-scripts.js" (
    echo       Frontend dependencies missing - running npm install...
    echo       This may take 3-5 minutes. Please wait.
    cd /d "%FRONTEND_DIR%" && call npm.cmd install --no-audit --no-fund
)

:: Build the React application every start
echo       Building frontend production build...
cd /d "%FRONTEND_DIR%" && call npm.cmd run build

:: Start serve on port 53005
start "DWM Frontend" cmd /k "cd /d ""%FRONTEND_DIR%"" && call npx.cmd -y serve -s build -l 53005 --no-clipboard"

:: ── Done ──────────────────────────────────────────────────────────

echo.
echo  =============================================
echo   DWM Portal is starting up!
echo  =============================================
echo.
echo   Frontend  :  http://192.168.5.22:53005
echo   Backend   :  http://192.168.5.22:58010
echo   API Docs  :  http://192.168.5.22:58010/docs
echo   Network Access: http://192.168.5.22:58010 and http://192.168.5.22:53005
echo.
echo   Run stop.bat to shut down both servers.
echo.
exit