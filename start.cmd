@echo off
setlocal

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"

echo =============================================
echo   Starting DWM Portal Production
echo =============================================

start "DWM Backend" cmd /k "cd /d \"%BACKEND_DIR%\" && call venv\Scripts\activate.bat && uvicorn app.main:app --host 0.0.0.0 --port 8008"

start "DWM Frontend" cmd /k "cd /d \"%FRONTEND_DIR%\" && set PORT=3003 && npm start"

endlocal
