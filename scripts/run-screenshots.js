#!/usr/bin/env node
/**
 * Cross-platform screenshot runner
 * Detects the platform and runs the appropriate wrapper script
 */

const { spawn } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';
const scriptsDir = __dirname;
const projectDir = path.dirname(scriptsDir);

// Pass through any command line arguments
const args = process.argv.slice(2);

if (isWindows) {
  // On Windows, run PowerShell script
  console.log('Detected Windows - running PowerShell wrapper...\n');
  const ps = spawn('powershell.exe', [
    '-ExecutionPolicy', 'Bypass',
    '-File', path.join(scriptsDir, 'generate-screenshots.ps1'),
    ...args
  ], {
    cwd: projectDir,
    stdio: 'inherit'
  });

  ps.on('close', (code) => {
    process.exit(code || 0);
  });

  ps.on('error', (err) => {
    console.error('Failed to run PowerShell script:', err.message);
    console.log('\nFalling back to direct Node execution...\n');
    runNodeDirect(args);
  });
} else {
  // On macOS/Linux, run bash script
  console.log('Detected macOS/Linux - running bash wrapper...\n');
  const bash = spawn('bash', [
    path.join(scriptsDir, 'generate-screenshots.sh'),
    ...args
  ], {
    cwd: projectDir,
    stdio: 'inherit'
  });

  bash.on('close', (code) => {
    process.exit(code || 0);
  });

  bash.on('error', (err) => {
    console.error('Failed to run bash script:', err.message);
    console.log('\nFalling back to direct Node execution...\n');
    runNodeDirect(args);
  });
}

function runNodeDirect(args) {
  // Fallback: run the Node script directly (no cleanup wrapper)
  const node = spawn('node', [
    path.join(scriptsDir, 'generate-screenshots.js'),
    ...args
  ], {
    cwd: projectDir,
    stdio: 'inherit'
  });

  node.on('close', (code) => {
    console.log('\nNote: Running without wrapper script - manual cleanup may be needed.');
    console.log('Kill any remaining Electron processes manually if needed.');
    process.exit(code || 0);
  });
}
