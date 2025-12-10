#!/usr/bin/env node

// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le


/**
 * Icon Generation Script
 *
 * Converts the base SVG icon to all required formats:
 * - PNG files at multiple sizes
 * - Windows .ico file (multi-resolution)
 * - Microsoft Store tile assets
 * - macOS .icns file (multi-resolution) - skipped without Apple Developer account
 */

const sharp = require('sharp');
const pngToIco = require('png-to-ico').default || require('png-to-ico');
const iconGen = require('icon-gen');
const fs = require('fs');
const path = require('path');

// Standard icon sizes for multi-resolution icons
const ICON_SIZES = [256, 128, 64, 48, 32, 16];

// Microsoft Store asset sizes (required for MSIX packaging)
// See: https://learn.microsoft.com/en-us/windows/apps/design/style/iconography/app-icon-construction
const STORE_ASSETS = [
  { name: 'StoreLogo.png', size: 50 },           // Store logo
  { name: 'Square150x150Logo.png', size: 150 },  // Medium tile
  { name: 'Square44x44Logo.png', size: 44 },     // App list icon
  { name: 'Wide310x150Logo.png', width: 310, height: 150 }, // Wide tile
  { name: 'LargeTile.png', size: 300 },          // Large tile (300x300 for Store)
  { name: 'SmallTile.png', size: 71 },           // Small tile (Square71x71Logo)
];

const BASE_DIR = path.join(__dirname, '..');
const ASSETS_DIR = path.join(BASE_DIR, 'assets', 'icons');
const SVG_PATH = path.join(ASSETS_DIR, 'icon.svg');
const PNG_DIR = path.join(ASSETS_DIR, 'png');
const WIN_DIR = path.join(ASSETS_DIR, 'win');
const MAC_DIR = path.join(ASSETS_DIR, 'mac');
const STORE_DIR = path.join(BASE_DIR, 'assets', 'store');

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

async function generateICNS() {
  console.log('📦 Generating macOS .icns file...');

  if (!fs.existsSync(MAC_DIR)) {
    fs.mkdirSync(MAC_DIR, { recursive: true });
  }

  try {
    // icon-gen can create icns from SVG or PNG
    // Using the 256px PNG as the source for best quality
    await iconGen(SVG_PATH, MAC_DIR, {
      report: false,
      icns: {
        name: 'icon',
        sizes: [16, 32, 64, 128, 256, 512, 1024]
      }
    });

    console.log('✅ macOS icon.icns generated!\n');
  } catch (error) {
    console.log('⚠️  macOS .icns generation failed:', error.message);
    console.log('   This is optional - the app will still work.\n');
  }
}

async function generateStoreAssets() {
  console.log('📦 Generating Microsoft Store assets...');

  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  }

  for (const asset of STORE_ASSETS) {
    const outputPath = path.join(STORE_DIR, asset.name);
    const width = asset.width || asset.size;
    const height = asset.height || asset.size;

    console.log(`  ✓ Generating ${asset.name} (${width}x${height})...`);

    if (width === height) {
      // Square asset - simple resize
      await sharp(SVG_PATH)
        .resize(width, height)
        .png()
        .toFile(outputPath);
    } else {
      // Wide tile - need to composite icon centered on background
      const iconSize = Math.min(width, height) - 20; // Leave some padding
      const icon = await sharp(SVG_PATH)
        .resize(iconSize, iconSize)
        .png()
        .toBuffer();

      // Create background with brand color and composite icon
      await sharp({
        create: {
          width: width,
          height: height,
          channels: 4,
          background: { r: 241, g: 129, b: 56, alpha: 1 } // #f18138 - orange from logo
        }
      })
        .composite([{
          input: icon,
          gravity: 'center'
        }])
        .png()
        .toFile(outputPath);
    }
  }

  console.log('✅ Microsoft Store assets generated!\n');
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
    await generateICNS();
    await generateStoreAssets();

    console.log('=' .repeat(50));
    console.log('🎉 All icons generated successfully!');
    console.log('\nGenerated files:');
    console.log('  • PNG files:    assets/icons/png/icon-*.png');
    console.log('  • Windows:      assets/icons/win/icon.ico');
    console.log('  • macOS:        assets/icons/mac/icon.icns');
    console.log('  • Store assets: assets/store/*.png');

  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

main();
