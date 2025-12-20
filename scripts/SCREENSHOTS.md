# Screenshot Generator

Automated screenshot capture tool for Mac App Store and Microsoft Store submissions.

## Overview

Uses Puppeteer to connect to the running Electron app via Chrome DevTools Protocol and capture screenshots of the main window and settings window in both light and dark themes.

## Usage

### Quick Start (Recommended)

```bash
npm run screenshots
```

This cross-platform command will:
1. Detect your OS (macOS/Windows)
2. Launch the Electron app in screenshot mode
3. Capture 4 screenshots (main light, main dark, settings general, settings models)
4. Clean up Electron processes
5. Save screenshots to the appropriate platform directory

### Manual Mode

If you prefer to run the app manually:

**macOS/Linux:**
```bash
# Terminal 1: Start app with screenshot mode
SCREENSHOT_MODE=1 npm start

# Terminal 2: Run screenshot capture
node scripts/generate-screenshots.js --connect-only
```

**Windows (PowerShell):**
```powershell
# Terminal 1: Start app with screenshot mode
$env:SCREENSHOT_MODE="1"; npm start

# Terminal 2: Run screenshot capture
node scripts/generate-screenshots.js --connect-only
```

**Windows (CMD):**
```cmd
:: Terminal 1: Start app with screenshot mode
set SCREENSHOT_MODE=1 && npm start

:: Terminal 2: Run screenshot capture
node scripts/generate-screenshots.js --connect-only
```

## Output

Screenshots are saved to platform-specific directories:

- **macOS**: `assets/store/screenshots/mac/`
- **Windows**: `assets/store/screenshots/windows/`

Generated files:
- `01-main-light.png` - Main window with light theme
- `02-main-dark.png` - Main window with dark theme
- `03-settings-general.png` - Settings window, General tab
- `04-settings-models.png` - Settings window, Models tab

## Files

| File | Description |
|------|-------------|
| `generate-screenshots.js` | Main Node.js script (cross-platform) |
| `generate-screenshots.sh` | Bash wrapper for macOS/Linux cleanup |
| `generate-screenshots.ps1` | PowerShell wrapper for Windows cleanup |
| `run-screenshots.js` | Cross-platform runner (detects OS) |

## How It Works

1. **Screenshot Mode**: When `SCREENSHOT_MODE=1`, the app:
   - Enables remote debugging on port 9222
   - Disables DevTools auto-open
   - Logs startup status for detection

2. **Puppeteer Connection**: The script connects to the app via Chrome DevTools Protocol URL `http://localhost:9222`

3. **Content Injection**: Sample email content is injected via `page.evaluate()` to demonstrate the app's functionality

4. **Theme Switching**: Themes are switched by setting the `data-theme` attribute on `document.documentElement`

5. **Settings Window**: Opened via the exposed IPC API `window.electronAPI.openSettings()` (keyboard shortcuts don't work with Puppeteer)

6. **Cleanup**: Platform-specific wrappers handle killing Electron processes after capture

## Troubleshooting

### Connection Failed
- Ensure no other Electron instances are running: `pkill -f electron` (macOS) or Task Manager (Windows)
- Check that port 9222 is not in use

### Settings Screenshot Missing
- The settings window is detected by URL containing "settings"
- Check console output for "Found settings page!"

### Process Cleanup Issues
- macOS: `pkill -f "Compose Booster"`
- Windows: Use Task Manager to kill "Compose Booster" or "electron" processes

## Windows Testing Notes

**Date**: 2024-12-10
**Status**: Untested on Windows

The following should be verified on Windows:
1. PowerShell script execution works (`generate-screenshots.ps1`)
2. Process cleanup via `Get-Process | Stop-Process` works correctly
3. Screenshots save to `assets/store/screenshots/windows/`
4. Theme switching works correctly
5. Settings window detection works

If issues are found, please update this document with the fix.
