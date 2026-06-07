@echo off

echo Stopping DWM Portal...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :58010') do (
    taskkill /PID %%a /F >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :53005') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo DWM Portal stopped successfully.
pause