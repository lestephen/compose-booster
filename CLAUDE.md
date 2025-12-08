# Claude.md - AI Development Context

This document provides context for AI assistants (like Claude) working on this codebase.

## Project Overview

**Compose Booster** is an AI-powered desktop email composition assistant built with Electron, TypeScript, and Vite. It helps users improve email drafts using various AI models through the OpenRouter API.

## Tech Stack

- **Electron 39.2.6** - Cross-platform desktop framework
- **TypeScript 4.5.4** - Type-safe JavaScript
- **Vite 5.4.21** - Build tool and dev server
- **Electron Forge** - Packaging and distribution
- **electron-store** - Encrypted configuration storage
- **Axios** - HTTP client for API requests

## Architecture

### Process Model
- **Main Process** (`src/main/`): Window management, IPC handlers, API calls, config persistence
- **Renderer Processes** (`src/renderer/`): Two windows (main UI + settings)
- **Preload Scripts** (`src/preload/`): Security bridge via contextBridge

### Key Directories

```
src/
├── main/                    # Main process (Node.js)
│   ├── config/             # Default configuration
│   ├── services/           # Core services (API, Config, Menu)
│   ├── ipc/                # IPC handlers and channels
│   └── windows/            # Window managers
├── preload/                # Preload scripts (security bridge)
│   ├── preload.ts          # Main window
│   └── settingsPreload.ts  # Settings window
├── renderer/               # Renderer processes (browser/UI)
│   ├── main/               # Main application window
│   │   └── components/     # UI components
│   └── settings/           # Settings window
│       ├── components/     # Settings UI components
│       └── tabs/           # Settings tab implementations
└── shared/                 # Shared types and constants
```

### Data Flow Pattern

```
User Action → Renderer → Preload (contextBridge) → IPC → Main Process → Service
                                                                          ↓
User sees result ← Renderer ← Preload ← IPC ← Main Process ← Service Response
```

## Important Patterns

### 1. IPC Communication

All communication between renderer and main process uses typed IPC channels:

```typescript
// Define channel in src/main/ipc/channels.ts
export const IPC_CHANNELS = {
  CONFIG_GET_ALL: 'config:get-all',
  // ...
}

// Implement handler in src/main/ipc/handlers.ts
ipcMain.handle(IPC_CHANNELS.CONFIG_GET_ALL, async () => {
  // ...
})

// Expose in preload script
contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: () => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET_ALL)
})

// Use in renderer
const result = await window.electronAPI.getConfig()
```

### 2. Configuration Management

- **Storage**: electron-store with encryption
- **Location**: `%APPDATA%/compose-booster/config.json` (Windows) or `~/Library/Application Support/compose-booster/config.json` (macOS)
- **Security**: API keys are encrypted, never logged
- **Defaults**: Defined in `src/main/config/defaultConfig.ts`

### 3. Component Pattern (Renderer)

Vanilla TypeScript classes for UI components:

```typescript
export class ComponentName {
  private container: HTMLElement;
  private config: AppConfig;
  private onConfigChange: (config: AppConfig) => void;

  constructor(container: HTMLElement, config: AppConfig, onConfigChange: (config: AppConfig) => void) {
    this.container = container;
    this.config = config;
    this.onConfigChange = onConfigChange;
    this.render();
  }

  private render(): void {
    // Build UI
  }

  public updateConfig(config: AppConfig): void {
    this.config = config;
    this.render();
  }
}
```

## Development Workflow

### Running the App

```bash
# Development mode
npm start

# Development with mock API (no OpenRouter credits consumed)
$env:MOCK_API="true"; npm start  # PowerShell
set MOCK_API=true && npm start   # CMD
MOCK_API=true npm start          # macOS/Linux

# Build for production
npm run package
npm run make
```

### Hot Reload Behavior

- **Renderer changes** (HTML, CSS, TS in `renderer/`) → Auto-reload ✅
- **Main process changes** (TS in `main/`) → Requires manual restart ⚠️

### Testing

- Use mock mode to avoid consuming API credits during development
- Test on both Windows and macOS when possible
- Settings are stored locally - use fresh profiles for testing

## Critical Security Notes

### 1. API Key Protection

- **NEVER** log API keys
- **NEVER** commit `*.config.json` files
- API keys stored encrypted via electron-store
- Export feature excludes API key for safety

### 2. Content Security Policy

- CSP disabled in development mode (commented in HTML)
- **MUST** re-enable for production builds
- Strict CSP prevents XSS attacks

### 3. IPC Security

- All IPC uses `contextBridge` - never expose full Node.js APIs
- Validate all inputs from renderer processes
- Use type-safe IPC channels

## Common Tasks

### Adding a New IPC Channel

1. Add channel constant to `src/main/ipc/channels.ts`
2. Implement handler in `src/main/ipc/handlers.ts`
3. Expose via preload in `src/preload/preload.ts` or `settingsPreload.ts`
4. Add TypeScript declaration to preload file
5. Use in renderer code

### Adding a New Setting

1. Update `AppConfig` type in `src/shared/types.ts`
2. Add default value in `src/main/config/defaultConfig.ts`
3. Update settings UI in `src/renderer/settings/`
4. Update settings controller to handle new setting

### Adding a New UI Component

1. Create component file in `src/renderer/main/components/`
2. Import and instantiate in `src/renderer/main/renderer.ts`
3. Add CSS to `src/renderer/main/styles.css`

## Code Style Guidelines

### TypeScript

- Use strict typing - avoid `any`
- Prefer interfaces over types for objects
- Use `readonly` for immutable properties
- Always handle errors with try/catch

### Naming Conventions

- **Files**: camelCase (e.g., `apiService.ts`)
- **Classes**: PascalCase (e.g., `ApiService`)
- **Functions/Variables**: camelCase (e.g., `getConfig`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `IPC_CHANNELS`)
- **Interfaces**: PascalCase (e.g., `AppConfig`)

### HTML/CSS

- Use semantic HTML5 elements
- CSS classes: kebab-case (e.g., `.hot-combo-btn`)
- CSS variables for theming (defined in `:root`)
- Mobile-first responsive design (even for desktop app)

## Current Release

**v1.0.0** - Initial public release (December 2025)

- Available on GitHub Releases (Windows x64 unsigned)
- Microsoft Store submission pending approval

**Post-release features in development:**
- Style Profiles - Custom writing styles with example emails
- Output Format Options - Plain text, Markdown, or HTML clipboard output
- Context Window Warnings - Visual alerts for large inputs
- Response Regeneration - Try Again button with version navigation

See ROADMAP.md for planned features and CHANGELOG.md for version history.

## File Headers

All TypeScript source files should include the MPL-2.0 license header:

```typescript
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le
```

## Build Commands

```bash
# Development
npm start                    # Run in dev mode
npm test                     # Run tests
npm run test:coverage        # Run tests with coverage

# Production builds
npm run make                 # Build all platforms
npm run make:store           # Build MSIX for Microsoft Store

# Assets
npm run icons                # Regenerate icons from SVG
```

## Troubleshooting

### Common Issues

1. **Window doesn't appear**: Check Vite config, verify HTML paths
2. **IPC not working**: Ensure channel names match, check preload script loaded
3. **Settings not saving**: Check electron-store initialization, verify config path
4. **Mock mode not working**: Verify environment variable set before `npm start`

### Debug Tools

- **DevTools**: Automatically open in development mode
- **Main process logs**: Check terminal output
- **Config location**: Use electron-store's default path
- **IPC debugging**: Add console.logs in handlers and preload

## External Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [Electron Forge Documentation](https://www.electronforge.io/)
- [OpenRouter API Documentation](https://openrouter.ai/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Git Workflow

- **Main branch**: `master` - stable releases only
- **Feature branches**: `feature/<name>` - all active development
- **Commit messages**: Descriptive, professional format. **DO NOT include Claude Code attribution or co-author lines** - keep commit messages clean and professional without AI references
- **Protected files**: See `.gitignore` for sensitive data exclusions

### Feature Branch Process

**IMPORTANT**: Always create a feature branch for any changes, no matter how small:

```bash
# 1. Create and switch to feature branch
git checkout -b feature/my-feature-name

# 2. Make changes and commit
git add .
git commit -m "Description of changes"

# 3. Push branch to remote for review on GitHub
git push -u origin feature/my-feature-name

# 4. After review/approval, merge back to master
git checkout master
git merge feature/my-feature-name --no-edit

# 5. Push merged master to remote
git push

# 6. Delete the merged branch (local and remote)
git branch -d feature/my-feature-name
git push origin --delete feature/my-feature-name
```

**Always push feature branches to remote** - the user prefers reviewing branches on GitHub before merging.

**Always clean up merged branches** - after merging to master, delete the feature branch both locally and on the remote. This prevents stale branches from accumulating and causing confusion about ongoing work. If unsure whether a branch should be deleted, ask the user first.

This ensures:
- Master remains stable and deployable
- Changes can be easily rolled back if needed
- Clean history with logical groupings of changes
- Code review opportunity before merging

## Notes for AI Assistants

### When Working on This Project

1. **Read first**: Always read files before editing to understand current state
2. **Type safety**: Maintain strict TypeScript typing throughout
3. **Security first**: Never expose sensitive data or bypass security measures
4. **Test locally**: Encourage use of mock mode for testing
5. **Document changes**: Update this file if architecture changes significantly
6. **Cross-platform**: Consider Windows and macOS differences
7. **Git commits**: **IMPORTANT** - Do NOT include Claude Code attribution, co-author lines, or any AI-related references in commit messages. Keep commits professional and clean.

### Key Files to Reference

- `src/shared/types.ts` - All TypeScript interfaces
- `src/main/config/defaultConfig.ts` - Default values
- `src/main/ipc/channels.ts` - IPC channel definitions
- `ROADMAP.md` - Planned features and technical debt
- `CHANGELOG.md` - Version history following Keep a Changelog format

---

**Last Updated**: 2025-12-08
**Project Status**: v1.0.0 Released, planning v1.1
