#!/usr/bin/env node

// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le


/**
 * Fix APPX Manifest for Microsoft Store Submission
 *
 * The electron-windows-store package doesn't properly pass through
 * all MakerAppX configuration options. This script fixes the manifest
 * and rebuilds the package for Store submission.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Store identity from Partner Center
const STORE_CONFIG = {
  identityName: 'ColdRayLabs.ComposeBooster',
  publisher: 'CN=D41101CD-1A4E-4FB3-8255-4BA6A73D7D90',
  publisherDisplayName: 'Cold Ray Labs',
  backgroundColor: '#f18138',
};

const BUILD_DIR = path.join(__dirname, '..', 'out', 'x64', 'make', 'appx', 'x64');
const PRE_APPX_DIR = path.join(BUILD_DIR, 'pre-appx');
const MANIFEST_PATH = path.join(PRE_APPX_DIR, 'AppXManifest.xml');
const OUTPUT_APPX = path.join(BUILD_DIR, 'ComposeBooster-Store.appx');

function main() {
  console.log('🔧 Fixing APPX manifest for Microsoft Store...\n');

  // Check if manifest exists
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('❌ Manifest not found. Run "npm run make -- --targets=@electron-forge/maker-appx" first.');
    process.exit(1);
  }

  // Read the manifest
  let manifest = fs.readFileSync(MANIFEST_PATH, 'utf-8');
  console.log('📖 Read existing manifest');

  // Fix Identity Name
  manifest = manifest.replace(
    /Identity Name="[^"]*"/,
    `Identity Name="${STORE_CONFIG.identityName}"`
  );
  console.log(`  ✓ Identity Name → ${STORE_CONFIG.identityName}`);

  // Fix Publisher
  manifest = manifest.replace(
    /Publisher="[^"]*"/,
    `Publisher="${STORE_CONFIG.publisher}"`
  );
  console.log(`  ✓ Publisher → ${STORE_CONFIG.publisher}`);

  // Fix PublisherDisplayName
  manifest = manifest.replace(
    /<PublisherDisplayName>[^<]*<\/PublisherDisplayName>/,
    `<PublisherDisplayName>${STORE_CONFIG.publisherDisplayName}</PublisherDisplayName>`
  );
  console.log(`  ✓ PublisherDisplayName → ${STORE_CONFIG.publisherDisplayName}`);

  // Fix BackgroundColor
  manifest = manifest.replace(
    /BackgroundColor="#[^"]*"/,
    `BackgroundColor="${STORE_CONFIG.backgroundColor}"`
  );
  console.log(`  ✓ BackgroundColor → ${STORE_CONFIG.backgroundColor}`);

  // Write the fixed manifest
  fs.writeFileSync(MANIFEST_PATH, manifest);
  console.log('\n✅ Manifest updated!\n');

  // Find Windows Kit makeappx.exe
  const windowsKitBase = 'C:\\Program Files (x86)\\Windows Kits\\10\\bin';
  let makeAppxPath = null;

  if (fs.existsSync(windowsKitBase)) {
    const versions = fs.readdirSync(windowsKitBase)
      .filter(d => d.startsWith('10.'))
      .sort()
      .reverse();

    for (const version of versions) {
      const candidate = path.join(windowsKitBase, version, 'x64', 'makeappx.exe');
      if (fs.existsSync(candidate)) {
        makeAppxPath = candidate;
        break;
      }
    }
  }

  if (!makeAppxPath) {
    console.error('❌ Could not find Windows SDK makeappx.exe');
    process.exit(1);
  }

  console.log(`📦 Using makeappx from: ${makeAppxPath}\n`);

  // Remove old signed appx if exists
  const oldAppx = path.join(BUILD_DIR, 'composebooster.appx');
  if (fs.existsSync(oldAppx)) {
    fs.unlinkSync(oldAppx);
    console.log('  ✓ Removed old signed package');
  }

  // Create new unsigned APPX package
  console.log('  ✓ Creating unsigned APPX package...\n');

  try {
    execSync(`"${makeAppxPath}" pack /d "${PRE_APPX_DIR}" /p "${OUTPUT_APPX}" /o`, {
      stdio: 'inherit'
    });
  } catch (error) {
    console.error('❌ Failed to create APPX package');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Store-ready APPX package created!');
  console.log(`\n📁 Package location:\n   ${OUTPUT_APPX}`);
  console.log('\n📤 Upload this file to Partner Center for Store submission.');
  console.log('   Microsoft will sign it with your Store certificate.');
  console.log('='.repeat(60));
}

main();
