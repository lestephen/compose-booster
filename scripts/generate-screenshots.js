/**
 * App Store Screenshot Generator (Cross-Platform)
 *
 * Uses Puppeteer to automate screenshot capture from the running Electron app.
 * Works on macOS, Windows, and Linux.
 *
 * USAGE:
 *   Option 1 (Auto-launch): node scripts/generate-screenshots.js
 *   Option 2 (Manual):
 *     - macOS/Linux: SCREENSHOT_MODE=1 npm start
 *     - Windows: set SCREENSHOT_MODE=1 && npm start (CMD)
 *                $env:SCREENSHOT_MODE="1"; npm start (PowerShell)
 *     Then run: node scripts/generate-screenshots.js --connect-only
 *
 * The --connect-only flag skips launching the app and just connects to an
 * already-running instance with remote debugging enabled.
 *
 * PLATFORM DETECTION:
 *   Screenshots are saved to platform-specific directories:
 *   - macOS: assets/store/screenshots/mac/
 *   - Windows: assets/store/screenshots/windows/
 */

const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const CONNECT_ONLY = process.argv.includes('--connect-only');
const DEBUG_PORT = 9222;

// Platform detection for output directory
const IS_WINDOWS = process.platform === 'win32';
const PLATFORM_DIR = IS_WINDOWS ? 'windows' : 'mac';
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'store', 'screenshots', PLATFORM_DIR);

// App Store screenshot dimensions
// Mac App Store accepts: 1280×800, 1440×900, 2560×1600, 2880×1800
// We use 1280×800 viewport with 2x scale to capture crisp 2560×1600 screenshots
const SCREENSHOT_WIDTH = 1280;
const SCREENSHOT_HEIGHT = 800;
const DEVICE_SCALE_FACTOR = 2;  // 2x for Retina-quality screenshots (2560×1600)

// Sample content for screenshots
const SAMPLE_INPUT = `Hi John,

I wanted to follow up on our meeting last week. I think we should move forward with the project but I'm not sure about the timeline. Can we discuss? Also the budget might be an issue.

Let me know when works for you.

Thanks
Sarah`;

const SAMPLE_OUTPUT = `Hi John,

Thank you for taking the time to meet with me last week. I wanted to follow up on our discussion regarding the project.

After reviewing our conversation, I believe we should proceed with the initiative. However, I'd like to discuss two key considerations:

Timeline - I want to ensure we establish realistic milestones that align with our team's capacity.

Budget - There may be some constraints we need to address before moving forward.

Would you be available for a brief call this week to discuss these points? I'm flexible and happy to work around your schedule.

Best regards,
Sarah`;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}`);
  }
}

async function launchElectronApp() {
  console.log('Launching Electron app in screenshot mode via npm start...');

  const appPath = path.join(__dirname, '..');

  const electronProcess = spawn('npm', ['start'], {
    cwd: appPath,
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true,
    env: {
      ...process.env,
      SCREENSHOT_MODE: '1',
      DEBUG_PORT: String(DEBUG_PORT),
      ELECTRON_ENABLE_LOGGING: '1'
    }
  });

  let startupComplete = false;

  electronProcess.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Launched Electron app') || output.includes('Screenshot Mode')) {
      startupComplete = true;
    }
    if (output.includes('[Screenshot') || output.includes('error') || output.includes('Error')) {
      console.log(output.trim());
    }
  });

  electronProcess.stderr.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Error') || output.includes('error')) {
      console.error('[Error]', output.trim());
    }
  });

  electronProcess.on('error', (err) => {
    console.error('Failed to start app:', err);
  });

  console.log('Waiting for Vite compilation and app to start...');

  for (let i = 0; i < 30; i++) {
    await delay(1000);
    if (startupComplete) {
      console.log('Startup detected, waiting a bit more...');
      await delay(3000);
      break;
    }
  }

  return electronProcess;
}

async function connectToBrowser(retries = 10) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempting to connect to browser (attempt ${i + 1}/${retries})...`);

      const response = await fetch(`http://localhost:${DEBUG_PORT}/json/version`);
      const data = await response.json();
      console.log('Browser info:', data.Browser);

      const browser = await puppeteer.connect({
        browserURL: `http://localhost:${DEBUG_PORT}`,
        defaultViewport: null
      });

      console.log('Connected to browser successfully!');
      return browser;
    } catch (err) {
      console.log(`Connection attempt ${i + 1} failed:`, err.message);
      if (i < retries - 1) {
        await delay(2000);
      }
    }
  }
  throw new Error('Failed to connect to browser after multiple attempts');
}

async function getMainPage(browser) {
  const pages = await browser.pages();
  console.log(`Found ${pages.length} page(s)`);

  for (const page of pages) {
    const url = page.url();
    console.log('  Page URL:', url);
    if (url.includes('index.html') || (url.includes('renderer') && url.includes('main'))) {
      return page;
    }
  }

  return pages.find(p => !p.url().startsWith('devtools://') && p.url() !== 'about:blank') || pages[0];
}

async function getSettingsPage(browser) {
  const pages = await browser.pages();
  for (const page of pages) {
    const url = page.url();
    if (url.includes('settings')) {
      return page;
    }
  }
  return null;
}

async function setContent(page) {
  console.log('Setting sample content...');

  try {
    await page.waitForSelector('textarea', { timeout: 10000 });

    // Use page.evaluate to set content directly via JavaScript
    // This bypasses readonly restrictions
    await page.evaluate((input, output) => {
      const textareas = document.querySelectorAll('textarea');
      if (textareas[0]) {
        textareas[0].value = input;
        // Trigger input event so character counters update
        textareas[0].dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (textareas[1]) {
        // Temporarily remove readonly to set value
        const wasReadonly = textareas[1].hasAttribute('readonly');
        textareas[1].removeAttribute('readonly');
        textareas[1].value = output;
        textareas[1].dispatchEvent(new Event('input', { bubbles: true }));
        // Keep readonly removed for screenshots - looks better
      }
    }, SAMPLE_INPUT, SAMPLE_OUTPUT);

    console.log('  Content set via JavaScript');
    await delay(500);
  } catch (err) {
    console.log('Could not set content automatically:', err.message);
  }
}

async function setWindowSize(page, width, height) {
  // Set the viewport size - this controls what gets captured in screenshots
  // deviceScaleFactor: 2 produces 2560×1600 from 1280×800 viewport (Retina quality)
  await page.setViewport({
    width,
    height,
    deviceScaleFactor: DEVICE_SCALE_FACTOR
  });

  await delay(500);
  const actualWidth = width * DEVICE_SCALE_FACTOR;
  const actualHeight = height * DEVICE_SCALE_FACTOR;
  console.log(`  Viewport set to: ${width}x${height} (captures at ${actualWidth}x${actualHeight})`);
}

async function captureScreenshot(page, filename) {
  const filepath = path.join(OUTPUT_DIR, filename);
  console.log(`  Capturing: ${filename}...`);

  await page.screenshot({
    path: filepath,
    type: 'png'
  });

  console.log(`  Saved: ${filename}`);
  return filepath;
}

async function setTheme(page, theme) {
  // Set theme directly via JavaScript by changing the data-theme attribute
  await page.evaluate((themeName) => {
    document.documentElement.setAttribute('data-theme', themeName);
  }, theme);
  await delay(300);
  console.log(`  Theme set to: ${theme}`);
}

async function openSettings(page) {
  // Use the exposed IPC API to open settings (keyboard shortcuts don't work with Puppeteer)
  console.log('  Opening settings via IPC...');
  await page.evaluate(() => {
    window.electronAPI.openSettings();
  });
  await delay(1500);
}

async function main() {
  const storeName = IS_WINDOWS ? 'Microsoft Store' : 'Mac App Store';
  console.log(`=== ${storeName} Screenshot Generator ===\n`);
  console.log(`Platform: ${process.platform} (saving to ${PLATFORM_DIR}/)\n`);

  if (CONNECT_ONLY) {
    console.log('Mode: Connect to existing app (--connect-only)');
    if (IS_WINDOWS) {
      console.log('Make sure the app is running with: $env:SCREENSHOT_MODE="1"; npm start\n');
    } else {
      console.log('Make sure the app is running with: SCREENSHOT_MODE=1 npm start\n');
    }
  } else {
    console.log('Mode: Auto-launch app');
    console.log('(Use --connect-only to skip auto-launch)\n');
  }

  await ensureOutputDir();

  let electronProcess = null;
  let browser = null;

  try {
    if (!CONNECT_ONLY) {
      electronProcess = await launchElectronApp();
    }

    browser = await connectToBrowser();
    const page = await getMainPage(browser);

    if (!page) {
      throw new Error('Could not find main application page');
    }

    console.log('\nMain page URL:', page.url());

    // Resize window to exact screenshot dimensions
    console.log(`\nResizing window to ${SCREENSHOT_WIDTH}x${SCREENSHOT_HEIGHT}...`);
    await setWindowSize(page, SCREENSHOT_WIDTH, SCREENSHOT_HEIGHT);

    // Set up sample content
    await setContent(page);
    await delay(1000);

    // === SCREENSHOT 1: Main Window - Light Theme ===
    console.log('\n--- Screenshot 1: Main Window (Light Theme) ---');
    await setTheme(page, 'light');
    await captureScreenshot(page, '01-main-light.png');

    // === SCREENSHOT 2: Main Window - Dark Theme ===
    console.log('\n--- Screenshot 2: Main Window (Dark Theme) ---');
    await setTheme(page, 'dark');
    await captureScreenshot(page, '02-main-dark.png');

    // Set back to light for settings
    await setTheme(page, 'light');

    // === SCREENSHOT 3: Settings - General Tab ===
    console.log('\n--- Screenshot 3: Settings Window ---');
    await openSettings(page);

    // Wait longer for settings window to open
    await delay(1500);

    // Try to find settings page - check multiple times
    let settingsPage = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const pages = await browser.pages();
      console.log(`  Checking pages (attempt ${attempt + 1}): found ${pages.length} pages`);

      for (const p of pages) {
        const url = p.url();
        console.log(`    - ${url}`);
        if (url.includes('settings')) {
          settingsPage = p;
          break;
        }
      }

      if (settingsPage) break;
      await delay(500);
    }

    if (settingsPage) {
      console.log('  Found settings page!');
      await delay(500);

      // Resize settings window to exact dimensions
      await setWindowSize(settingsPage, SCREENSHOT_WIDTH, SCREENSHOT_HEIGHT);

      // Apply theme to settings window too
      await settingsPage.evaluate((themeName) => {
        document.documentElement.setAttribute('data-theme', themeName);
      }, 'light');
      await delay(300);

      await captureScreenshot(settingsPage, '03-settings-general.png');

      // Try clicking on Models tab
      try {
        // Try different selectors for the Models tab
        const clicked = await settingsPage.evaluate(() => {
          const tabs = document.querySelectorAll('.tab-button, [data-tab], button');
          for (const tab of tabs) {
            if (tab.textContent && tab.textContent.includes('Models')) {
              tab.click();
              return true;
            }
          }
          return false;
        });

        if (clicked) {
          await delay(500);
          await captureScreenshot(settingsPage, '04-settings-models.png');
        } else {
          console.log('  Could not find Models tab');
        }
      } catch (e) {
        console.log('  Could not switch to Models tab:', e.message);
      }
    } else {
      console.log('  Settings window not found - skipping settings screenshots');
    }

    console.log('\n=== Screenshot Generation Complete ===');
    console.log(`Screenshots saved to: ${OUTPUT_DIR}`);

    // List generated files
    console.log('\nGenerated files:');
    const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png'));
    files.forEach(f => console.log(`  - ${f}`));

  } catch (err) {
    console.error('\nError:', err.message);
    console.error(err.stack);
  } finally {
    if (browser) {
      try {
        browser.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
    }

    // Note: Process cleanup is handled by the shell script wrapper (generate-screenshots.sh)
    // Just exit the Node process - the shell script trap will clean up Electron
    console.log('\nExiting script (shell wrapper will cleanup Electron)...');
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
