#!/bin/bash
# Mac App Store Screenshot Generator Wrapper
# Handles cleanup of Electron processes after screenshot capture

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Mac App Store Screenshot Generator ==="
echo ""

# Function to cleanup processes
cleanup() {
    echo ""
    echo "Cleaning up..."

    # Kill any running Electron/Compose Booster processes
    pkill -f "Compose Booster" 2>/dev/null || true
    pkill -f "electron" 2>/dev/null || true
    pkill -f "electron-forge" 2>/dev/null || true

    # Wait a moment for processes to die
    sleep 1

    # Force kill if still running
    pkill -9 -f "Compose Booster" 2>/dev/null || true
    pkill -9 -f "Electron" 2>/dev/null || true

    echo "Cleanup complete."
}

# Set trap to cleanup on exit (including Ctrl+C)
trap cleanup EXIT

# Change to project directory
cd "$PROJECT_DIR"

# Run the Node.js screenshot script
# The script will exit when done, and our trap will handle cleanup
node scripts/generate-screenshots.js "$@"

# Script completed successfully
echo ""
echo "Screenshots saved to: assets/store/screenshots/mac/"
ls -la assets/store/screenshots/mac/*.png 2>/dev/null || echo "No screenshots found"
