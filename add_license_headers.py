#!/usr/bin/env python3
"""
Add MPL 2.0 license headers to source files in the Compose Booster project.

Usage:
    python add_license_headers.py --dry-run    # Preview changes without modifying files
    python add_license_headers.py              # Apply headers to all files
    python add_license_headers.py --backup     # Create .bak files before modifying

This script:
- Adds MPL 2.0 license headers to TypeScript, JavaScript, HTML, and CSS files
- Skips files that already have license headers
- Excludes node_modules, .vite, out, and other build directories
- Preserves existing file encoding
- Can create backups before modification
"""

import os
import sys
import argparse
from pathlib import Path
from typing import List, Set
import shutil

# License header templates
HEADER_TS_JS = """// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

"""

HEADER_HTML = """<!--
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at https://mozilla.org/MPL/2.0/.

  Copyright (c) 2025 Stephen Le
-->

"""

HEADER_CSS = """/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025 Stephen Le
 */

"""

# Directories to exclude
EXCLUDED_DIRS = {
    'node_modules',
    '.vite',
    'out',
    'dist',
    '.git',
    '__pycache__',
    '.cache',
    'coverage',
    'build',
}

# File extensions to process
SUPPORTED_EXTENSIONS = {
    '.ts': HEADER_TS_JS,
    '.js': HEADER_TS_JS,
    '.tsx': HEADER_TS_JS,
    '.jsx': HEADER_TS_JS,
    '.html': HEADER_HTML,
    '.css': HEADER_CSS,
}

# Files to exclude (exact matches)
EXCLUDED_FILES = {
    'vite.config.ts',
    'vite.main.config.ts',
    'vite.preload.config.ts',
    'vite.renderer.config.ts',
    'forge.config.ts',
}


def should_skip_directory(dir_path: Path) -> bool:
    """Check if directory should be skipped."""
    return any(excluded in dir_path.parts for excluded in EXCLUDED_DIRS)


def has_license_header(content: str) -> bool:
    """Check if file already has a license header."""
    # Look for key phrases from MPL 2.0 header
    indicators = [
        'Mozilla Public License',
        'MPL',
        'https://mozilla.org/MPL/2.0',
        'Copyright (c) 2025 Stephen Le',
    ]
    return any(indicator in content[:500] for indicator in indicators)


def add_header_to_file(file_path: Path, dry_run: bool = False, backup: bool = False) -> bool:
    """
    Add license header to a single file.

    Returns True if file was modified (or would be modified in dry-run mode).
    """
    # Check if file should be processed
    if file_path.suffix not in SUPPORTED_EXTENSIONS:
        return False

    if file_path.name in EXCLUDED_FILES:
        return False

    # Read file content
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        # Try with a different encoding
        try:
            with open(file_path, 'r', encoding='latin-1') as f:
                content = f.read()
        except Exception as e:
            print(f"[WARN] Error reading {file_path}: {e}")
            return False
    except Exception as e:
        print(f"[WARN] Error reading {file_path}: {e}")
        return False

    # Check if header already exists
    if has_license_header(content):
        print(f"[SKIP] {file_path} (already has header)")
        return False

    # Get appropriate header
    header = SUPPORTED_EXTENSIONS[file_path.suffix]

    # For HTML files, insert after <!DOCTYPE> or at the beginning
    if file_path.suffix == '.html':
        if content.strip().startswith('<!DOCTYPE'):
            # Find end of DOCTYPE declaration
            doctype_end = content.find('>', content.find('<!DOCTYPE')) + 1
            new_content = content[:doctype_end] + '\n' + header + content[doctype_end:].lstrip()
        else:
            new_content = header + content
    else:
        # For other files, add at the beginning
        new_content = header + content

    if dry_run:
        print(f"[DRY-RUN] Would add header to: {file_path}")
        return True

    # Create backup if requested
    if backup:
        backup_path = file_path.with_suffix(file_path.suffix + '.bak')
        shutil.copy2(file_path, backup_path)
        print(f"[BACKUP] Created backup: {backup_path}")

    # Write modified content
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"[OK] Added header to: {file_path}")
        return True
    except Exception as e:
        print(f"[ERROR] Error writing {file_path}: {e}")
        return False


def find_source_files(root_dir: Path) -> List[Path]:
    """Find all source files that should be processed."""
    source_files = []

    for ext in SUPPORTED_EXTENSIONS.keys():
        for file_path in root_dir.rglob(f'*{ext}'):
            # Skip excluded directories
            if should_skip_directory(file_path):
                continue

            # Skip excluded files
            if file_path.name in EXCLUDED_FILES:
                continue

            source_files.append(file_path)

    return sorted(source_files)


def main():
    parser = argparse.ArgumentParser(
        description='Add MPL 2.0 license headers to source files',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python add_license_headers.py --dry-run    # Preview changes
  python add_license_headers.py              # Apply headers
  python add_license_headers.py --backup     # Apply with backups
        """
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Preview changes without modifying files'
    )
    parser.add_argument(
        '--backup',
        action='store_true',
        help='Create .bak backup files before modifying'
    )
    parser.add_argument(
        '--dir',
        type=Path,
        default=Path('.'),
        help='Root directory to process (default: current directory)'
    )

    args = parser.parse_args()

    # Resolve root directory
    root_dir = args.dir.resolve()

    if not root_dir.exists():
        print(f"[ERROR] Directory does not exist: {root_dir}")
        sys.exit(1)

    print(f"Scanning for source files in: {root_dir}")
    print(f"Supported extensions: {', '.join(SUPPORTED_EXTENSIONS.keys())}")
    print(f"Excluded directories: {', '.join(EXCLUDED_DIRS)}")
    print()

    if args.dry_run:
        print("DRY RUN MODE - No files will be modified")
        print()

    # Find all source files
    source_files = find_source_files(root_dir)

    if not source_files:
        print("[WARN] No source files found!")
        sys.exit(0)

    print(f"Found {len(source_files)} source files")
    print()

    # Process each file
    modified_count = 0
    skipped_count = 0
    error_count = 0

    for file_path in source_files:
        try:
            was_modified = add_header_to_file(file_path, dry_run=args.dry_run, backup=args.backup)
            if was_modified:
                modified_count += 1
            else:
                skipped_count += 1
        except Exception as e:
            print(f"[ERROR] Unexpected error processing {file_path}: {e}")
            error_count += 1

    # Print summary
    print()
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total files scanned:  {len(source_files)}")
    print(f"Files modified:       {modified_count}")
    print(f"Files skipped:        {skipped_count}")
    print(f"Errors:               {error_count}")

    if args.dry_run:
        print()
        print("This was a dry run. No files were actually modified.")
        print("Run without --dry-run to apply the headers.")

    if args.backup and modified_count > 0:
        print()
        print(f"Backups created with .bak extension")
        print("You can safely delete these after verifying the changes.")

    print()

    if error_count > 0:
        sys.exit(1)


if __name__ == '__main__':
    main()
