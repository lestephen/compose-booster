#!/usr/bin/env node

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
const APPX_ASSETS_DIR = path.join(__dirname, '..', 'assets', 'appx');

// Asset mapping: our custom assets -> manifest references
const ASSET_FILES = {
  'Square310x310Logo.png': 'Square310x310Logo.png',
  'Wide310x150Logo.png': 'Wide310x150Logo.png',
  'Square150x150Logo.png': 'Square150x150Logo.png',
  'Square44x44Logo.png': 'Square44x44Logo.png',
  'StoreLogo.png': 'StoreLogo.png',
};

function copyAssets() {
  console.log('📦 Copying custom assets...');
  const targetAssetsDir = path.join(PRE_APPX_DIR, 'assets');

  // Ensure target assets directory exists
  if (!fs.existsSync(targetAssetsDir)) {
    fs.mkdirSync(targetAssetsDir, { recursive: true });
  }

  for (const [sourceFile, targetFile] of Object.entries(ASSET_FILES)) {
    const sourcePath = path.join(APPX_ASSETS_DIR, sourceFile);
    const targetPath = path.join(targetAssetsDir, targetFile);

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`  ✓ ${sourceFile} → assets/${targetFile}`);
    } else {
      console.warn(`  ⚠ Source not found: ${sourcePath}`);
    }
  }

  // Remove default SampleAppx assets if they exist
  const sampleFiles = ['SampleAppx.150x150.png', 'SampleAppx.310x150.png', 'SampleAppx.44x44.png', 'SampleAppx.50x50.png'];
  for (const sampleFile of sampleFiles) {
    const samplePath = path.join(targetAssetsDir, sampleFile);
    if (fs.existsSync(samplePath)) {
      fs.unlinkSync(samplePath);
      console.log(`  ✓ Removed default: ${sampleFile}`);
    }
  }

  console.log('');
}

function main() {
  console.log('🔧 Fixing APPX manifest for Microsoft Store...\n');

  // Check if manifest exists
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('❌ Manifest not found. Run "npm run make -- --targets=@electron-forge/maker-appx" first.');
    process.exit(1);
  }

  // Copy custom assets first
  copyAssets();

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

  // Fix asset references - replace SampleAppx defaults with our custom assets
  console.log('\n🖼️  Updating asset references...');

  // Fix StoreLogo (Package Logo)
  manifest = manifest.replace(
    /<Logo>[^<]*<\/Logo>/,
    '<Logo>assets\\StoreLogo.png</Logo>'
  );
  console.log('  ✓ Logo → assets\\StoreLogo.png');

  // Fix Square150x150Logo
  manifest = manifest.replace(
    /Square150x150Logo="[^"]*"/,
    'Square150x150Logo="assets\\Square150x150Logo.png"'
  );
  console.log('  ✓ Square150x150Logo → assets\\Square150x150Logo.png');

  // Fix Square44x44Logo
  manifest = manifest.replace(
    /Square44x44Logo="[^"]*"/,
    'Square44x44Logo="assets\\Square44x44Logo.png"'
  );
  console.log('  ✓ Square44x44Logo → assets\\Square44x44Logo.png');

  // Fix Wide310x150Logo
  manifest = manifest.replace(
    /Wide310x150Logo="[^"]*"/,
    'Wide310x150Logo="assets\\Wide310x150Logo.png"'
  );
  console.log('  ✓ Wide310x150Logo → assets\\Wide310x150Logo.png');

  // Add Square310x310Logo (Large tile) if not present
  if (!manifest.includes('Square310x310Logo')) {
    // Handle both self-closing (/>) and regular (>) tags
    manifest = manifest.replace(
      /(<uap:DefaultTile\s+[^>]*?)(\/?>)/,
      (match, before, ending) => {
        // Remove trailing whitespace before the ending
        const trimmed = before.trimEnd();
        return `${trimmed} Square310x310Logo="assets\\Square310x310Logo.png"${ending}`;
      }
    );
    console.log('  ✓ Added Square310x310Logo → assets\\Square310x310Logo.png');
  } else {
    manifest = manifest.replace(
      /Square310x310Logo="[^"]*"/,
      'Square310x310Logo="assets\\Square310x310Logo.png"'
    );
    console.log('  ✓ Square310x310Logo → assets\\Square310x310Logo.png');
  }

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
