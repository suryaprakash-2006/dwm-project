@echo off
setlocal

echo.
echo  =============================================
echo   DWM Portal - Stopping Production Server
echo  =============================================
echo.

set "ERRORS=0"

:: ── Stop Backend (port 58010) ─────────────────────────────────────

echo [1/2] Stopping Backend on port 58010...
set "FOUND_BACKEND=0"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr " :58010 "') do (
    set /a "FOUND_BACKEND+=1"
    taskkill /PID %%a /F >nul 2>&1
)
if "%FOUND_BACKEND%"=="0" (
    echo       [WARN] No process found on port 58010 (already stopped?)
) else (
    echo       [OK] Backend stopped.
)

:: ── Stop Frontend (port 53005) ────────────────────────────────────

echo [2/2] Stopping Frontend on port 53005...
set "FOUND_FRONTEND=0"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr " :53005 "') do (
    set /a "FOUND_FRONTEND+=1"
    taskkill /PID %%a /F >nul 2>&1
)
if "%FOUND_FRONTEND%"=="0" (
    echo       [WARN] No process found on port 53005 (already stopped?)
) else (
    echo       [OK] Frontend stopped.
)

:: ── Done ──────────────────────────────────────────────────────────

echo.
echo  DWM Portal stopped successfully.
echo.
pause