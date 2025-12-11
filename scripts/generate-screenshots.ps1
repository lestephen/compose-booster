# Mac App Store / Microsoft Store Screenshot Generator Wrapper (Windows)
# Handles cleanup of Electron processes after screenshot capture

$ErrorActionPreference = "Stop"

Write-Host "=== Screenshot Generator (Windows) ===" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir

# Function to cleanup processes
function Cleanup {
    Write-Host ""
    Write-Host "Cleaning up..." -ForegroundColor Yellow

    # Kill any running Electron/Compose Booster processes
    Get-Process -Name "Compose Booster" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Get-Process -Name "electron" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

    # Wait a moment for processes to die
    Start-Sleep -Seconds 1

    Write-Host "Cleanup complete." -ForegroundColor Green
}

# Register cleanup on exit
try {
    # Change to project directory
    Set-Location $ProjectDir

    # Run the Node.js screenshot script
    # Pass through any arguments
    node scripts/generate-screenshots.js $args

    # Script completed successfully
    Write-Host ""
    Write-Host "Screenshots saved to: assets\store\screenshots\windows\" -ForegroundColor Green

    if (Test-Path "assets\store\screenshots\windows\*.png") {
        Get-ChildItem "assets\store\screenshots\windows\*.png" | ForEach-Object {
            Write-Host "  - $($_.Name)"
        }
    } else {
        Write-Host "No screenshots found in windows directory"
    }
}
finally {
    # Always run cleanup
    Cleanup
}
