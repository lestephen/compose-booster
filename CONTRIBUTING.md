# Contributing to Compose Booster

Thank you for your interest in contributing to Compose Booster! This document provides guidelines and instructions for developers who want to contribute to or work with the codebase.

## 📋 Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Building](#building)
- [Code Style](#code-style)
- [Submitting Changes](#submitting-changes)

---

## 🛠️ Development Setup

### Prerequisites

- **Node.js 16+** ([Download](https://nodejs.org/))
- **npm or yarn**
- **OpenRouter API key** ([Get one here](https://openrouter.ai/keys))
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/lestephen/compose-booster.git
   cd compose-booster
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start in development mode**
   ```bash
   npm start
   ```

4. **Configure your API key**
   - Open the app
   - Go to File → Settings (or press Ctrl/Cmd + ,)
   - Enter your OpenRouter API key
   - Click "Test Key" to verify
   - Click "Save Settings"

### Mock API Mode (Development)

Test the application without consuming API credits:

**Windows (PowerShell):**
```powershell
$env:MOCK_API="true"
npm start
```

**Windows (CMD):**
```cmd
set MOCK_API=true
npm start
```

**macOS/Linux:**
```bash
MOCK_API=true npm start
```

---

## 📁 Project Structure

```
compose-booster/
├── src/
│   ├── main/              # Electron main process
│   │   ├── windows/       # Window managers
│   │   ├── services/      # Core services (API, Config, Menu)
│   │   ├── ipc/           # IPC handlers and channels
│   │   └── config/        # Default configuration
│   │
│   ├── preload/           # Preload scripts (security bridge)
│   │   ├── preload.ts     # Main window preload
│   │   └── settingsPreload.ts
│   │
│   ├── renderer/          # Renderer processes (UI)
│   │   ├── main/          # Main application window
│   │   │   ├── components/
│   │   │   ├── index.html
│   │   │   ├── renderer.ts
│   │   │   └── styles.css
│   │   └── settings/      # Settings window
│   │       ├── components/
│   │       └── tabs/
│   │
│   └── shared/            # Shared types and constants
│
├── tests/                 # Test files
├── scripts/               # Build and utility scripts
├── assets/                # Application icons and resources
├── forge.config.ts        # Electron Forge configuration
├── vite.*.config.ts       # Vite build configs
└── package.json
```

### Key Technologies

- **Electron 39.2.6** - Cross-platform desktop framework
- **TypeScript 4.5.4** - Type-safe development
- **Vite 5.4.21** - Fast build tool and dev server
- **Electron Forge** - Build and packaging
- **electron-store** - Encrypted configuration storage
- **Axios** - HTTP client for API calls

---

## 🔄 Development Workflow

### Available Scripts

```bash
npm start          # Start in development mode
npm test           # Run tests
npm run test:ui    # Run tests with UI
npm run package    # Package the application
npm run make       # Create distributable
npm run icons      # Regenerate application icons
npm run lint       # Run ESLint
```

### Hot Reload Behavior

- **Renderer changes** (HTML, CSS, TS in `renderer/`) → Auto-reload ✅
- **Main process changes** (TS in `main/`) → Requires manual restart ⚠️

### Adding Features

For detailed architecture and patterns, see [CLAUDE.md](CLAUDE.md).

**Quick guide:**
1. Update types in `src/shared/types.ts`
2. Add IPC channels in `src/main/ipc/channels.ts`
3. Implement handler in `src/main/ipc/handlers.ts`
4. Expose via preload in `src/preload/preload.ts`
5. Use in renderer components

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Run with coverage
npm run test:coverage
```

### Test Structure

- **Unit tests**: `tests/` directory
- **Integration tests**: Test IPC communication and service integration
- **Mock mode**: Use `MOCK_API=true` for testing without API costs

### Writing Tests

- Use Vitest for testing
- Mock Electron APIs when necessary
- Test core services (apiService, configService)
- Validate type definitions

---

## 📦 Building

### Development Build

```bash
npm run package
```

Creates a package in the `out/` directory.

### Production Distributables

**Windows:**
```bash
npm run make
```

Creates installer in `out/make/squirrel.windows/x64/`

**macOS:**
```bash
npm run make -- --platform=darwin
```

**Note:** macOS builds require Apple Developer account for signing.

### Icon Generation

To regenerate application icons from SVG source:

```bash
npm run icons
```

Icons are generated from `assets/icons/icon.svg`:
- **PNG files**: `assets/icons/png/` (multiple sizes)
- **Windows .ico**: `assets/icons/win/icon.ico`

---

## 💅 Code Style

### TypeScript

- **Strict typing** - Avoid `any`
- **Interfaces over types** for objects
- **Readonly** for immutable properties
- **Error handling** - Always use try/catch

### Naming Conventions

- **Files**: camelCase (e.g., `apiService.ts`)
- **Classes**: PascalCase (e.g., `ApiService`)
- **Functions/Variables**: camelCase (e.g., `getConfig`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `IPC_CHANNELS`)
- **Interfaces**: PascalCase (e.g., `AppConfig`)

### HTML/CSS

- **Semantic HTML5** elements
- **CSS classes**: kebab-case (e.g., `.quick-action-btn`)
- **CSS variables** for theming (defined in `:root`)
- **Mobile-first** responsive design (even for desktop)

### License Headers

All source files must include the MPL 2.0 license header. See `LEGAL_HEADER.txt` for templates.

**Add headers automatically:**
```bash
python scripts/add_license_headers.py
```

---

## 🚀 Submitting Changes

### Before Submitting

1. **Test thoroughly**
   - Run all tests: `npm test`
   - Test in both development and built modes
   - Test on both Windows and macOS if possible

2. **Check code style**
   - Run linter: `npm run lint`
   - Follow naming conventions
   - Add license headers to new files

3. **Update documentation**
   - Update README.md if user-facing changes
   - Update CLAUDE.md if architecture changes
   - Add comments for complex logic

### Pull Request Process

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow code style guidelines
   - Add tests for new features
   - Update documentation

4. **Commit your changes**
   ```bash
   git commit -m "Add feature: your feature description

   Detailed explanation of changes...

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Your Name <your-email@example.com>"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Provide clear description of changes
   - Reference any related issues
   - Include screenshots for UI changes

---

## 🐛 Reporting Issues

### Bug Reports

When reporting bugs, include:
- **Description** of the issue
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Environment** (OS, Electron version, etc.)
- **Screenshots** if applicable
- **Error messages** from console

### Feature Requests

When requesting features:
- **Use case** - Why is this needed?
- **Proposed solution** - How should it work?
- **Alternatives considered**

---

## 📚 Additional Resources

- **Architecture Guide**: [CLAUDE.md](CLAUDE.md)
- **Implementation Roadmap**: [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Testing Guide**: [TESTING.md](TESTING.md)
- **Distribution Strategy**: [DISTRIBUTION_STRATEGY.md](DISTRIBUTION_STRATEGY.md)
- **Electron Documentation**: https://www.electronjs.org/docs
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/

---

## 📄 License

By contributing to Compose Booster, you agree that your contributions will be licensed under the Mozilla Public License 2.0 (MPL-2.0).

See [LICENSE](LICENSE) for details.

---

## 🙏 Thank You!

Thank you for contributing to Compose Booster! Your efforts help make this tool better for everyone.

If you have questions, feel free to:
- Open an issue on GitHub
- Check existing documentation
- Review the codebase

Happy coding! 🚀
