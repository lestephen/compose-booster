#!/usr/bin/env node

// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le


/**
 * Copyright Header Check Script
 *
 * Checks that all TypeScript source files have the required MPL-2.0 license header.
 * Can optionally add missing headers with --fix flag.
 *
 * Usage:
 *   node scripts/check-headers.js        # Check only
 *   node scripts/check-headers.js --fix  # Add missing headers
 */

const fs = require('fs');
const path = require('path');

const HEADER = `// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

`;

const HEADER_PATTERN = /^\/\/ This Source Code Form is subject to the terms of the Mozilla Public/;

const SRC_PATTERNS = [
  'src/**/*.ts',
  'scripts/**/*.js',
];

const IGNORE_DIRS = ['node_modules', 'dist', 'out', '.vite'];

function findFilesSync(dir, pattern) {
  const files = [];
  const ext = pattern === 'src/**/*.ts' ? '.ts' : '.js';
  const baseDir = pattern.startsWith('src/') ? path.join(dir, 'src') : path.join(dir, 'scripts');

  function walk(currentDir) {
    if (!fs.existsSync(currentDir)) return;

    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (!IGNORE_DIRS.includes(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith(ext)) {
        files.push(fullPath);
      }
    }
  }

  walk(baseDir);
  return files;
}

function findFiles() {
  const baseDir = path.join(__dirname, '..');
  const tsFiles = findFilesSync(baseDir, 'src/**/*.ts');
  const jsFiles = findFilesSync(baseDir, 'scripts/**/*.js');
  return [...tsFiles, ...jsFiles];
}

function hasHeader(content) {
  // Handle shebang lines - check if header is after shebang
  if (content.startsWith('#!')) {
    const firstNewline = content.indexOf('\n');
    const rest = content.slice(firstNewline + 1).trimStart();
    return HEADER_PATTERN.test(rest);
  }
  return HEADER_PATTERN.test(content);
}

function addHeader(content) {
  // Handle shebang lines
  if (content.startsWith('#!')) {
    const firstNewline = content.indexOf('\n');
    const shebang = content.slice(0, firstNewline + 1);
    const rest = content.slice(firstNewline + 1);
    return shebang + '\n' + HEADER + rest;
  }
  return HEADER + content;
}

async function main() {
  const fix = process.argv.includes('--fix');
  const files = findFiles();

  let missingCount = 0;
  let fixedCount = 0;
  const missingFiles = [];

  console.log(`Checking ${files.length} files for license headers...\n`);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    if (!hasHeader(content)) {
      missingCount++;
      const relativePath = path.relative(path.join(__dirname, '..'), file);
      missingFiles.push(relativePath);

      if (fix) {
        const newContent = addHeader(content);
        fs.writeFileSync(file, newContent);
        fixedCount++;
        console.log(`  ✓ Added header to: ${relativePath}`);
      } else {
        console.log(`  ✗ Missing header: ${relativePath}`);
      }
    }
  }

  console.log('');

  if (missingCount === 0) {
    console.log('✅ All files have the required license header!');
    process.exit(0);
  } else if (fix) {
    console.log(`✅ Added headers to ${fixedCount} files.`);
    process.exit(0);
  } else {
    console.log(`❌ ${missingCount} files are missing the license header.`);
    console.log('\nRun with --fix to add missing headers:');
    console.log('  node scripts/check-headers.js --fix');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
