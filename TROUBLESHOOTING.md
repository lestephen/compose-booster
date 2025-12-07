# Troubleshooting Guide

## Table of Contents
1. [Application Won't Start](#application-wont-start)
2. [API Issues](#api-issues)
3. [Settings Not Saving](#settings-not-saving)
4. [Quick Actions Not Working](#quick-actions-not-working)
5. [Performance Issues](#performance-issues)
6. [Development Issues](#development-issues)

## Application Won't Start

The application is building successfully but no window appears. Here are the common causes and fixes:

### Quick Fix - Try This First

The app might be crashing due to a runtime error. Try starting with console output:

**Windows PowerShell:**
```powershell
cd "c:\Users\Stephen\source\repos\compose-booster"
$env:ELECTRON_ENABLE_LOGGING=1
npm start 2>&1
```

**Windows CMD:**
```cmd
cd "c:\Users\Stephen\source\repos\compose-booster"
set ELECTRON_ENABLE_LOGGING=1
npm start 2>&1
```

This will show any error messages that are causing the crash.

### Common Issues

#### 1. Preload Script Path Issue
The preload scripts might not be found. Check `.vite/build/` directory to see if `preload.js` and `settingsPreload.js` exist.

#### 2. Configuration Service Crash
The electron-store might be having issues. Try clearing the config:

**Windows:**
```
del %APPDATA%\compose-booster\config.json
```

**macOS:**
```
rm ~/Library/Application\ Support/compose-booster/config.json
```

#### 3. Window Never Shows
The window might be created but never shown. Try modifying `src/main/windows/mainWindow.ts`:

Change `show: false` to `show: true` on line 27.

### How to Start the App

From the compose-booster directory:
```bash
npm start
```

### Check If It's Running

**Windows:**
```bash
tasklist | findstr electron
```

**macOS/Linux:**
```bash
ps aux | grep electron
```

### Enable Development Tools

The app should open DevTools automatically in development mode (check `src/main/windows/mainWindow.ts` line 57-59).

If you see errors in DevTools console, those will help diagnose the issue.

### Next Steps for Debugging

1. **Check the Vite dev server** - When you run `npm start`, you should see:
   ```
   ➜  Local:   http://localhost:5173/
   ```
   Try opening this in your browser to see if the renderer HTML loads.

2. **Check built files exist:**
   ```bash
   dir .vite\build
   ```
   You should see `main.js`, `preload.js`, and `settingsPreload.js`.

3. **Try a clean rebuild:**
   ```bash
   rm -rf .vite node_modules
   npm install
   npm start
   ```

### Known Working Configuration

The app was designed to work with:
- Node.js v16+
- Electron 39.2.6
- Vite 5.4.21
- Windows 10/11 or macOS 12+

### Manual Testing

If the app won't start, you can test the API service independently:

1. Set your API key in the code temporarily (NOT recommended for production)
2. Use the mock mode: `$env:MOCK_API="true"` then `npm start`

---

## API Issues

### Error: "API key not configured"

**Cause:** No API key has been set in Settings.

**Solution:**
1. Open Settings (File → Settings or Ctrl/Cmd+,)
2. Enter your OpenRouter API key
3. Click "Test Key" to verify
4. Click "Save Settings"

**Get an API key:** https://openrouter.ai/keys

### Error: "Invalid API key" or 401

**Cause:** API key is incorrect or expired.

**Solutions:**
1. Verify your key at https://openrouter.ai/keys
2. Generate a new key if needed
3. Make sure you copied the entire key (starts with `sk-or-v1-`)
4. Re-enter the key in Settings

### Error: "Insufficient credits" or 402

**Cause:** Your OpenRouter account has no credits.

**Solutions:**
1. Add credits at https://openrouter.ai/credits
2. Check your usage at https://openrouter.ai/activity
3. Use a cheaper model (e.g., Claude Haiku or GPT-4o Mini)

### Error: "Rate limit exceeded" or 429

**Cause:** Too many requests in a short time.

**Solutions:**
1. Wait for the specified retry time
2. Reduce request frequency
3. Upgrade your OpenRouter plan if needed

### Network/Connection Errors

**Symptoms:** "Failed to connect", "Network error", "Timeout"

**Solutions:**
1. Check your internet connection
2. Verify you can access https://openrouter.ai in a browser
3. Check firewall/antivirus settings
4. Try using a VPN if blocked

---

## Settings Not Saving

### Settings Reset on Restart

**Cause:** electron-store write permissions or corrupted config file.

**Solution:**
1. Close the app
2. Delete the config file:
   - **Windows:** `%APPDATA%\compose-booster\config.json`
   - **macOS:** `~/Library/Application Support/compose-booster/config.json`
3. Restart the app (creates new config with defaults)
4. Re-enter your settings

### Changes Don't Take Effect

**Cause:** Not clicking "Save Settings" button.

**Solution:**
- Always click "Save Settings" after making changes
- Settings window will close automatically on successful save

---

## Quick Actions Not Working

### Quick Action Button Does Nothing

**Causes & Solutions:**
1. **No input text** - Type or paste email into input area first
2. **Already processing** - Wait for current operation to finish
3. **No API key** - Configure API key in Settings
4. **Model not available** - Check OpenRouter service status

### Keyboard Shortcuts (Ctrl+1/2/3) Don't Work

**Solutions:**
1. Make sure the main window has focus (click on it)
2. Try clicking the button directly instead
3. Check if another app is capturing the shortcut
4. Restart the application

---

## Performance Issues

### Slow Response Times

**Causes:**
- Using slower models (GPT-4, Claude Opus)
- Long input text (>5000 words)
- Poor internet connection
- OpenRouter API server load

**Solutions:**
1. Use faster models (Claude Haiku, GPT-4o Mini)
2. Shorten input text
3. Check your internet speed
4. Try again during off-peak hours

### App Feels Laggy

**Solutions:**
1. Close other applications
2. Reduce font size in Settings
3. Disable window animations (OS setting)
4. Check CPU usage in Task Manager

---

## Development Issues

### Hot Reload Not Working

**Expected behavior:**
- **Renderer changes** (HTML/CSS/TS in renderer/) → Auto-reload ✅
- **Main process changes** → Manual restart required ⚠️

**For main process changes:**
1. Press Ctrl+C to stop
2. Run `npm start` again

### "rs" Command Doesn't Work

This is expected. Electron Forge doesn't support the "rs" restart command.

**To restart:**
- Ctrl+C then `npm start`

### Build Errors After Git Pull

**Solution:**
```bash
rm -rf .vite node_modules package-lock.json
npm install
npm start
```

### TypeScript Errors

**Solution:**
```bash
npm run typecheck  # Check for errors
```

Fix any type errors shown, then rebuild.

---

## Still Having Issues?

1. **Check the logs:**
   ```bash
   npm start 2>&1 | tee debug.log
   ```

2. **Clear everything and rebuild:**
   ```bash
   rm -rf .vite node_modules
   npm install
   npm start
   ```

3. **Report an issue:**
   - Include your OS and version
   - Include error messages from console
   - Include steps to reproduce
   - GitHub: https://github.com/lestephen/compose-booster/issues

---

## Useful Commands

```bash
# Start in mock mode (no API calls)
MOCK_API=true npm start

# Clean rebuild
rm -rf .vite node_modules && npm install && npm start

# Check for TypeScript errors
npm run typecheck

# Package the app
npm run package

# View Electron logs (Windows)
npm start 2>&1

# View Electron logs (macOS/Linux)
npm start 2>&1 | tee output.log
```

---

**Last Updated:** December 2024

