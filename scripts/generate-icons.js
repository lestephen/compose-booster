#!/usr/bin/env node

/**
 * Icon Generation Script
 *
 * Converts the base SVG icon to all required formats:
 * - PNG files at multiple sizes
 * - Windows .ico file (multi-resolution)
 * - macOS .icns file (multi-resolution)
 */

const sharp = require('sharp');
const pngToIco = require('png-to-ico').default || require('png-to-ico');
const fs = require('fs');
const path = require('path');

// Standard icon sizes for multi-resolution icons
const ICON_SIZES = [256, 128, 64, 48, 32, 16];
const BASE_DIR = path.join(__dirname, '..');
const ASSETS_DIR = path.join(BASE_DIR, 'assets', 'icons');
const SVG_PATH = path.join(ASSETS_DIR, 'icon.svg');
const PNG_DIR = path.join(ASSETS_DIR, 'png');
const WIN_DIR = path.join(ASSETS_DIR, 'win');
const MAC_DIR = path.join(ASSETS_DIR, 'mac');

async function generatePNGs() {
  console.log('📦 Generating PNG files...');

  if (!fs.existsSync(PNG_DIR)) {
    fs.mkdirSync(PNG_DIR, { recursive: true });
  }

  for (const size of ICON_SIZES) {
    const outputPath = path.join(PNG_DIR, `icon-${size}.png`);
    console.log(`  ✓ Generating ${size}x${size}...`);

    await sharp(SVG_PATH)
      .resize(size, size)
      .png()
      .toFile(outputPath);
  }

  console.log('✅ PNG files generated!\n');
}

async function generateICO() {
  console.log('📦 Generating Windows .ico file...');

  if (!fs.existsSync(WIN_DIR)) {
    fs.mkdirSync(WIN_DIR, { recursive: true });
  }

  // Collect PNG file paths for ico conversion
  const pngPaths = ICON_SIZES.map(size => path.join(PNG_DIR, `icon-${size}.png`));

  // Generate .ico file from PNGs
  const icoBuffer = await pngToIco(pngPaths);
  const icoPath = path.join(WIN_DIR, 'icon.ico');
  await fs.promises.writeFile(icoPath, icoBuffer);

  console.log('✅ Windows icon.ico generated!\n');
}

async function main() {
  console.log('🎨 Compose Booster - Icon Generator\n');
  console.log('=' .repeat(50) + '\n');

  try {
    // Check if SVG exists
    if (!fs.existsSync(SVG_PATH)) {
      console.error('❌ Error: icon.svg not found at', SVG_PATH);
      process.exit(1);
    }

    // Generate all formats
    await generatePNGs();
    await generateICO();

    console.log('=' .repeat(50));
    console.log('🎉 All icons generated successfully!');
    console.log('\nGenerated files:');
    console.log('  • PNG files: assets/icons/png/icon-*.png');
    console.log('  • Windows:   assets/icons/win/icon.ico');
    console.log('\nNext step: Update forge.config.ts to use these icons');
    console.log('Note: macOS .icns generation skipped (not needed without Apple Developer account)');

  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

main();
