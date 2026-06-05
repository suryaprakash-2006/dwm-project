$Root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$PidFile = Join-Path $Root ".dwm-pids.json"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "      DWM Portal Stop Script                " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

if (-not (Test-Path $PidFile)) {
    Write-Host "⚠️  No PID file found at $PidFile. Services may not be running." -ForegroundColor Yellow
    Exit 0
}

$payload = Get-Content -Path $PidFile -Raw | ConvertFrom-Json

function Stop-ServiceProcess {
    param(
        [string]$Name,
        [int]$Pid,
        [int]$Port
    )
    Write-Host "⏳ Stopping $Name (PID $Pid, port $Port)..." -ForegroundColor Cyan
    try {
        $proc = Get-Process -Id $Pid -ErrorAction SilentlyContinue
        if ($proc) {
            Stop-Process -Id $Pid -Force
            Write-Host "✅ $Name stopped." -ForegroundColor Green
        } else {
            Write-Host "⚠️  $Name process (PID $Pid) not found — may have already exited." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Failed to stop $Name (PID $Pid): $_" -ForegroundColor Red
    }

    # Double-check port is now free
    Start-Sleep -Milliseconds 500
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        Write-Host "⚠️  Port $Port is still in use after stopping $Name. You may need to kill PID $($conn.OwningProcess) manually." -ForegroundColor Yellow
    }
}

Stop-ServiceProcess -Name "Backend"  -Pid $payload.backend.pid  -Port $payload.backend.port
Stop-ServiceProcess -Name "Frontend" -Pid $payload.frontend.pid -Port $payload.frontend.port

Remove-Item -Path $PidFile -Force
Write-Host "🗑️  PID file removed." -ForegroundColor Cyan
Write-Host "✅ DWM Portal stopped." -ForegroundColor Green