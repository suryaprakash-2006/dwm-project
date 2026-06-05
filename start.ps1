$Root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$PidFile = Join-Path $Root ".dwm-pids.json"
$BackendDir = Join-Path $Root "backend"
$FrontendBuildDir = Join-Path $Root "frontend\build"
$FrontendPort = 3003
$BackendPort = 8000
$BackendFallbackStart = 8001

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "      DWM Portal Start Script               " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

$VenvPython = Join-Path $Root ".venv\Scripts\python.exe"
if (Test-Path $VenvPython) {
    $PythonExe = $VenvPython
    Write-Host "Using Python interpreter: $PythonExe" -ForegroundColor Cyan
} else {
    $PythonExe = "python"
    Write-Host "Using system Python interpreter: python" -ForegroundColor Yellow
}

function Get-PortOwnerInfo {
    param([int]$Pid)
    try {
        $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$Pid" -ErrorAction SilentlyContinue
        if ($proc) {
            return [PSCustomObject]@{
                Pid = $Pid
                Name = $proc.Name
                Executable = $proc.ExecutablePath
                CommandLine = $proc.CommandLine
            }
        }
    } catch {
        return [PSCustomObject]@{ Pid = $Pid; Name = $null; Executable = $null; CommandLine = $null }
    }
    return [PSCustomObject]@{ Pid = $Pid; Name = $null; Executable = $null; CommandLine = $null }
}

function Test-PortFree {
    param([int]$Port)
    return -not (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Report-PortConflict {
    param([int]$Port)
    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if (-not $connections) {
        Write-Host "No listening connection found on port $Port." -ForegroundColor Yellow
        return
    }

    foreach ($conn in $connections) {
        $owner = Get-PortOwnerInfo -Pid $conn.OwningProcess
        Write-Host "❌ Port $Port is already in use:" -ForegroundColor Red
        Write-Host "    PID:         $($owner.Pid)"
        Write-Host "    Executable:  $($owner.Executable)"
        Write-Host "    CommandLine: $($owner.CommandLine)"
        Write-Host "    Address:     $($conn.LocalAddress):$($conn.LocalPort)" -ForegroundColor Red
    }
}

function Find-NextFreePort {
    param([int]$StartPort)
    for ($port = $StartPort; $port -le 65535; $port++) {
        if (Test-PortFree -Port $port) {
            return $port
        }
    }
    throw "No free TCP port found starting at $StartPort."
}

if (-not (Test-Path $FrontendBuildDir)) {
    Write-Host "❌ Frontend build directory not found: $FrontendBuildDir" -ForegroundColor Red
    Write-Host "Run the frontend build first or verify the build path." -ForegroundColor Yellow
    Exit 1
}

if (-not (Test-PortFree -Port $FrontendPort)) {
    Report-PortConflict -Port $FrontendPort
    Write-Host "Please free port $FrontendPort and try again." -ForegroundColor Red
    Exit 1
}

if (-not (Test-PortFree -Port $BackendPort)) {
    Report-PortConflict -Port $BackendPort
    Write-Host "Port $BackendPort is occupied, searching for the next available backend port starting at $BackendFallbackStart..." -ForegroundColor Yellow
    $BackendPort = Find-NextFreePort -StartPort $BackendFallbackStart
    Write-Host "Using backend port $BackendPort instead." -ForegroundColor Green
}

Write-Host "⏳ Initializing backend database indexes and counters..." -ForegroundColor Cyan
$setup = Start-Process -FilePath $PythonExe -ArgumentList @("backend\scripts\setup_db.py") -WorkingDirectory $Root -Wait -NoNewWindow -PassThru
if ($setup.ExitCode -ne 0) {
    Write-Host "❌ Database setup failed. Make sure the backend environment is correct and required services are running." -ForegroundColor Red
    Exit $setup.ExitCode
}

Write-Host "🚀 Starting backend server on http://127.0.0.1:$BackendPort" -ForegroundColor Green
$backendProcess = Start-Process -FilePath $PythonExe -ArgumentList @("-m", "uvicorn", "app.main:app", "--reload", "--host", "127.0.0.1", "--port", "$BackendPort") -WorkingDirectory $BackendDir -NoNewWindow -PassThru

Write-Host "🚀 Starting frontend server on http://127.0.0.1:$FrontendPort" -ForegroundColor Green
$frontendProcess = Start-Process -FilePath $PythonExe -ArgumentList @(".\scripts\serve_spa.py", "--directory", $FrontendBuildDir, "--port", "$FrontendPort") -WorkingDirectory $Root -NoNewWindow -PassThru

Start-Sleep -Seconds 3

if (-not (Get-NetTCPConnection -LocalPort $BackendPort -State Listen -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Backend failed to bind port $BackendPort. Check backend logs or run stop.ps1 and inspect the Python environment." -ForegroundColor Red
    Exit 1
}

if (-not (Get-NetTCPConnection -LocalPort $FrontendPort -State Listen -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Frontend failed to bind port $FrontendPort. Another process may already be using it." -ForegroundColor Red
    Exit 1
}

Write-Host "⏳ Testing backend connectivity..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:$BackendPort/" -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ Backend connectivity test succeeded with HTTP status code $($response.StatusCode)." -ForegroundColor Green
} catch {
    $statusCode = $null
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
        $statusCode = [int]$_.Exception.Response.StatusCode
        Write-Host "⚠️  Backend responded with HTTP status code $statusCode." -ForegroundColor Yellow
    } else {
        Write-Host "❌ Backend connectivity test failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "If the server is starting slowly, wait a few seconds and check the process logs." -ForegroundColor Yellow
    }
}

$payload = [PSCustomObject]@{
    backend = [PSCustomObject]@{ pid = $backendProcess.Id; port = $BackendPort; started = (Get-Date).ToString("o") }
    frontend = [PSCustomObject]@{ pid = $frontendProcess.Id; port = $FrontendPort; started = (Get-Date).ToString("o") }
}
$payload | ConvertTo-Json -Depth 3 | Set-Content -Path $PidFile -Encoding UTF8

Write-Host "✅ DWM Portal started successfully." -ForegroundColor Green
Write-Host "   Backend:  http://127.0.0.1:$BackendPort" -ForegroundColor Cyan
Write-Host "   Frontend: http://127.0.0.1:$FrontendPort" -ForegroundColor Cyan
Write-Host "Use .\stop.ps1 to stop the backend and frontend services." -ForegroundColor Cyan
