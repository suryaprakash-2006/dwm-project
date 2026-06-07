@echo off
setlocal

echo =============================================
echo Starting DWM Portal Production
echo =============================================

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"

start "DWM Backend" cmd /k "cd /d %BACKEND_DIR% && if exist venv\Scripts\activate.bat call venv\Scripts\activate.bat && uvicorn app.main:app --host 0.0.0.0 --port 58010"

timeout /t 8 >nul

start "DWM Frontend" cmd /k "cd /d %FRONTEND_DIR% && if not exist build npm run build && npx serve -s build -l 53005"

echo.
echo Frontend : http://192.168.5.22:53005
echo Backend  : http://192.168.5.22:58010
echo.
pause