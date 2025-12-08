#!/usr/bin/env node

// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

/**
 * Automated Screenshot Generator
 *
 * Uses Playwright to launch the Electron app and capture screenshots
 * for Microsoft Store and Mac App Store submissions.
 *
 * Usage:
 *   node scripts/generate-screenshots.js [--store windows|mac|both]
 *
 * Requirements:
 *   - npm install playwright (already in devDependencies)
 *   - App must be built: npm run package
 */

const { _electron: electron } = require('playwright');
const path = require('path');
const fs = require('fs');

// Demo content for screenshots
const DEMO_INPUT = `Hi John,

I wanted to follow up on our meeting last week. I think we should move forward with the project but I'm not sure about the timeline. Can we discuss? Also the budget might be an issue.

Let me know when works for you.

Thanks
Sarah`;

const DEMO_OUTPUT = `Hi John,

Thank you for taking the time to meet with me last week. I wanted to follow up on our discussion regarding the project.

After reviewing our conversation, I believe we should proceed with the initiative. However, I'd like to discuss two key considerations:

Timeline - I want to ensure we establish realistic milestones that align with our team's capacity.

Budget - There may be some constraints we need to address before moving forward.

Would you be available for a brief call this week to discuss these points? I'm flexible and happy to work around your schedule.

Best regards,
Sarah`;

// Screenshot configurations
const SCREENSHOT_CONFIGS = {
  windows: {
    // Microsoft Store: min 1366x768
    mainWindow: { width: 1400, height: 900 },
    settingsWindow: { width: 1200, height: 800 },
    outputDir: 'screenshots/windows',
  },
  mac: {
    // Mac App Store: 1280x800 standard
    mainWindow: { width: 1440, height: 900 },
    settingsWindow: { width: 1200, height: 800 },
    outputDir: 'screenshots/mac',
  },
};

// Screenshot definitions
const SCREENSHOTS = [
  {
    name: '01-main-empty-light',
    description: 'Main window - Empty state (Light mode)',
    setup: async (page) => {
      await setTheme(page, 'light');
      await clearTextAreas(page);
    },
  },
  {
    name: '02-main-content-light',
    description: 'Main window - With content (Light mode)',
    setup: async (page) => {
      await setTheme(page, 'light');
      await setDemoContent(page);
    },
  },
  {
    name: '03-main-content-dark',
    description: 'Main window - With content (Dark mode)',
    setup: async (page) => {
      await setTheme(page, 'dark');
      await setDemoContent(page);
    },
  },
];

const SETTINGS_SCREENSHOTS = [
  {
    name: '04-settings-general',
    description: 'Settings - General tab',
    tab: 'general',
  },
  {
    name: '05-settings-models',
    description: 'Settings - Models tab',
    tab: 'models',
  },
];

// Helper functions
async function setTheme(page, theme) {
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t);
  }, theme);
  await page.waitForTimeout(300); // Wait for theme transition
}

async function clearTextAreas(page) {
  await page.evaluate(() => {
    const input = document.getElementById('inputText');
    const output = document.getElementById('outputText');
    if (input) input.value = '';
    if (output) output.value = '';
    // Trigger input event to update char count
    if (input) input.dispatchEvent(new Event('input'));
  });
}

async function setDemoContent(page) {
  await page.evaluate(({ input, output }) => {
    const inputEl = document.getElementById('inputText');
    const outputEl = document.getElementById('outputText');
    if (inputEl) {
      inputEl.value = input;
      inputEl.dispatchEvent(new Event('input'));
    }
    if (outputEl) {
      outputEl.value = output;
    }
  }, { input: DEMO_INPUT, output: DEMO_OUTPUT });
}

async function clickSettingsTab(page, tabName) {
  await page.evaluate((tab) => {
    const tabButton = document.querySelector(`[data-tab="${tab}"]`);
    if (tabButton) tabButton.click();
  }, tabName);
  await page.waitForTimeout(300);
}

async function ensureViteBuild() {
  // Check if .vite/build/main.js exists
  const mainJsPath = path.join(__dirname, '..', '.vite', 'build', 'main.js');
  if (!fs.existsSync(mainJsPath)) {
    console.log('⚠️  Vite build not found. Building app first...');
    const { execSync } = require('child_process');
    execSync('npm run package', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
  }
  return mainJsPath;
}

async function launchApp() {
  // Always use development mode for screenshots because packaged apps
  // have security fuses that prevent Playwright from attaching
  console.log('🔧 Launching app in development mode for screenshots...');

  // Ensure the Vite build exists
  const mainJsPath = await ensureViteBuild();
  console.log(`   Using: ${mainJsPath}`);

  const electronPath = require('electron');
  return await electron.launch({
    executablePath: electronPath,
    args: [
      mainJsPath,
      '--high-dpi-support=1',
      '--force-device-scale-factor=3',
    ],
    timeout: 30000,
  });
}

async function captureMainScreenshots(electronApp, page, config, outputDir) {
  console.log('\n📸 Capturing main window screenshots...');

  // Resize window
  await page.setViewportSize(config.mainWindow);

  for (const screenshot of SCREENSHOTS) {
    console.log(`  • ${screenshot.description}`);
    await screenshot.setup(page);
    await page.waitForTimeout(500); // Wait for any animations

    const outputPath = path.join(outputDir, `${screenshot.name}.png`);

    // Use Electron's native capturePage via main process for better quality
    const imageData = await electronApp.evaluate(async ({ BrowserWindow }) => {
      const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
      if (win) {
        const image = await win.webContents.capturePage();
        return image.toPNG().toString('base64');
      }
      return null;
    });

    if (imageData) {
      fs.writeFileSync(outputPath, Buffer.from(imageData, 'base64'));
    } else {
      // Fallback to Playwright screenshot
      await page.screenshot({ path: outputPath });
    }
    console.log(`    ✓ Saved: ${outputPath}`);
  }
}

async function captureSettingsScreenshots(electronApp, config, outputDir) {
  console.log('\n📸 Capturing settings window screenshots...');

  // Open settings window
  const mainPage = await electronApp.firstWindow();
  await mainPage.evaluate(() => {
    window.electronAPI.openSettings();
  });

  // Wait for settings window to open
  await mainPage.waitForTimeout(1000);

  // Get the settings window (should be the second window)
  const windows = electronApp.windows();
  const settingsPage = windows.find(w => w !== mainPage) || windows[1];

  if (!settingsPage) {
    console.log('  ⚠️ Could not find settings window, skipping...');
    return;
  }

  await settingsPage.setViewportSize(config.settingsWindow);
  await settingsPage.waitForTimeout(500);

  // Set light theme for settings screenshots
  await setTheme(settingsPage, 'light');

  for (const screenshot of SETTINGS_SCREENSHOTS) {
    console.log(`  • ${screenshot.description}`);
    await clickSettingsTab(settingsPage, screenshot.tab);
    await settingsPage.waitForTimeout(300);

    const outputPath = path.join(outputDir, `${screenshot.name}.png`);

    // Use Electron's native capturePage for better quality
    const imageData = await electronApp.evaluate(async ({ BrowserWindow }) => {
      const windows = BrowserWindow.getAllWindows();
      // Find settings window (the one that's not the main window)
      const settingsWin = windows.find(w => w.getTitle().includes('Settings')) || windows[1];
      if (settingsWin) {
        const image = await settingsWin.webContents.capturePage();
        return image.toPNG().toString('base64');
      }
      return null;
    });

    if (imageData) {
      fs.writeFileSync(outputPath, Buffer.from(imageData, 'base64'));
    } else {
      await settingsPage.screenshot({ path: outputPath });
    }
    console.log(`    ✓ Saved: ${outputPath}`);
  }

  // Close settings window
  await settingsPage.close();
}

async function generateScreenshots(store = 'both') {
  console.log('🎨 Compose Booster - Screenshot Generator\n');
  console.log('='.repeat(50));

  const stores = store === 'both' ? ['windows', 'mac'] : [store];

  let electronApp;
  try {
    electronApp = await launchApp();
    const page = await electronApp.firstWindow();

    // Wait for app to fully load
    await page.waitForTimeout(2000);

    for (const storeName of stores) {
      const config = SCREENSHOT_CONFIGS[storeName];
      const outputDir = path.join(__dirname, '..', 'assets', 'store', config.outputDir);

      console.log(`\n📁 Generating ${storeName.toUpperCase()} screenshots...`);
      console.log(`   Output: ${outputDir}`);

      // Create output directory
      fs.mkdirSync(outputDir, { recursive: true });

      // Capture main window screenshots
      await captureMainScreenshots(electronApp, page, config, outputDir);

      // Capture settings screenshots
      await captureSettingsScreenshots(electronApp, config, outputDir);
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Screenshots generated successfully!');
    console.log('\nGenerated files:');
    for (const storeName of stores) {
      const config = SCREENSHOT_CONFIGS[storeName];
      console.log(`  • ${storeName}: assets/store/${config.outputDir}/`);
    }

  } catch (error) {
    console.error('\n❌ Error generating screenshots:', error.message);
    if (error.message.includes('Cannot find module')) {
      console.log('\n💡 Make sure to build the app first: npm run package');
    }
    process.exit(1);
  } finally {
    if (electronApp) {
      await electronApp.close();
    }
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  let store = 'both';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--store' && args[i + 1]) {
      store = args[i + 1].toLowerCase();
      if (!['windows', 'mac', 'both'].includes(store)) {
        console.error('Invalid store option. Use: windows, mac, or both');
        process.exit(1);
      }
    }
  }

  return { store };
}

// Main
const { store } = parseArgs();
generateScreenshots(store);
