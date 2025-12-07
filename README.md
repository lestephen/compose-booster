# Compose Booster

An AI-powered desktop application for improving and polishing email drafts using OpenRouter's API with access to multiple state-of-the-art language models.

![License](https://img.shields.io/badge/license-MPL%202.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS-lightgrey.svg)

## Features

### 🚀 Quick Actions (Hot Combos)
- **⚡ Quick Polish** - Fast improvement with Claude 3.5 Haiku
- **🎯 Professional** - Professional tone with GPT-4 Turbo
- **✨ Friendly** - Warm, approachable tone with Claude 3.5 Sonnet
- One-click processing with keyboard shortcuts (Ctrl/Cmd + 1/2/3)

### 🎯 Custom Processing
- Select from 10 AI models (Claude, GPT-4, Gemini, and more)
- 7 prompt templates (Improve, Fix Grammar, Shorten, etc.)
- 10 tone options (Neutral, Professional, Friendly, etc.)
- Full customization control

### ⚙️ Smart Features
- **Mock API Mode** - Test without consuming credits
- **Clipboard Integration** - Quick paste and copy (Ctrl+Shift+V/C)
- **Signature Control** - Option to include/exclude email signatures
- **Dark Mode** - System, light, or dark theme support
- **Cost Tracking** - Monitor API usage and costs
- **Keyboard Shortcuts** - Efficient workflow with hotkeys

## Installation

### Prerequisites
- Node.js 16+
- npm or yarn
- OpenRouter API key ([Get one here](https://openrouter.ai/keys))

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
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

## Usage

### Basic Workflow

1. **Paste your email draft** into the input area (or press Ctrl+Shift+V)
2. **Choose a processing method:**
   - Click a Quick Action button (⚡ 🎯 ✨)
   - OR select Model + Prompt + Tone and click "Process"
3. **Review the AI response** in the output area
4. **Copy the result** (Ctrl+Shift+C) and use in your email client

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Enter` | Process with custom selection |
| `Ctrl/Cmd + 1/2/3` | Quick Actions (Hot Combos) |
| `Ctrl/Cmd + Shift + V` | Paste from clipboard |
| `Ctrl/Cmd + Shift + C` | Copy to clipboard |
| `Ctrl/Cmd + K` | Clear input |
| `Ctrl/Cmd + Shift + K` | Clear output |
| `Ctrl/Cmd + ,` | Open Settings |
| `ESC` | Cancel processing |

### Mock Mode (Development)

Test the application without using API credits:

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

## Settings

### General
- **API Key** - Your OpenRouter API key
- **Theme** - Light, Dark, or System
- **Font Size** - Adjust text size (10-20px)

### Preferences
- **Save window position** - Remember window location
- **Clear history on exit** - Privacy option
- **Include closing and signature** - Control whether AI generates email closings

### Advanced (Planned)
- Custom models configuration
- Custom prompt templates
- Custom tones
- Hot combo customization

## Building for Production

### Build the application
```bash
npm run package
```

This creates distributable packages in the `out` directory.

### Platform-Specific Builds

**Windows:**
```bash
npm run make -- --platform=win32
```

**macOS:**
```bash
npm run make -- --platform=darwin
```

## Architecture

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
│   │
│   └── shared/            # Shared types and constants
│
├── forge.config.ts        # Electron Forge configuration
├── vite.*.config.ts       # Vite build configs
└── package.json
```

### Key Technologies
- **Electron 39.2.6** - Cross-platform desktop framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Electron Forge** - Build and packaging
- **electron-store** - Encrypted configuration storage
- **Axios** - HTTP client for API calls

## API Models

The application supports 10+ AI models through OpenRouter:

| Model | Provider | Best For |
|-------|----------|----------|
| Claude 3.5 Sonnet | Anthropic | Balanced quality/speed |
| Claude 3.5 Haiku | Anthropic | Fast, cost-effective |
| GPT-4 Turbo | OpenAI | Complex tasks |
| GPT-4o | OpenAI | Multimodal |
| GPT-4o Mini | OpenAI | Fast, affordable |
| Gemini Pro 1.5 | Google | Long context |
| Llama 3.1 70B | Meta | Open source |
| Mixtral 8x7B | Mistral | Cost-effective |

## Troubleshooting

### Application won't start
See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed debugging steps.

**Quick fixes:**
```bash
# Clean rebuild
rm -rf .vite node_modules
npm install
npm start
```

### API key not working
1. Verify your key at https://openrouter.ai/keys
2. Check you have credits in your OpenRouter account
3. Use "Test Key" button in Settings
4. Try mock mode to test app functionality

### Window doesn't appear
1. Check console for errors: `npm start 2>&1 | more`
2. Try force showing window (see TROUBLESHOOTING.md)
3. Clear app data and restart

## Development

### Project Scripts

```bash
npm start          # Start in development mode
npm run package    # Package the application
npm run make       # Create distributable
npm run publish    # Publish release (requires setup)
```

### Hot Reload

- **Renderer changes** (HTML, CSS, TS in renderer/) → Auto-reload ✅
- **Main process changes** → Requires restart (Ctrl+C, npm start) ⚠️

### Adding Features

1. Update types in `src/shared/types.ts`
2. Add IPC channels in `src/main/ipc/channels.ts`
3. Implement handler in `src/main/ipc/handlers.ts`
4. Expose via preload in `src/preload/preload.ts`
5. Use in renderer components

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License & Legal

### Open Source License

This project is licensed under the **Mozilla Public License 2.0 (MPL-2.0)**. The source code is freely available for use, modification, and distribution under the terms of the MPL 2.0 license. See the [LICENSE](LICENSE) file for the complete license text.

[![License: MPL 2.0](https://img.shields.io/badge/License-MPL%202.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0)

### ⚠️ NO WARRANTY DISCLAIMER

**THIS SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.**

This application is developed and released by an individual developer, not a corporation. By using this software, you acknowledge that:

- The software is provided for free with no guarantees of support, updates, or bug fixes
- The author assumes no liability for any damages, data loss, or issues arising from use of this software
- You use this software entirely at your own risk
- No warranty is provided regarding fitness for any particular purpose

### Trademarks

The "Compose Booster" name and logo are trademarks of Stephen Le and may not be used in derivative works without explicit written permission.

**Important for Forking:**
- ✅ You MAY fork and modify the source code under the MPL 2.0 license
- ❌ You MAY NOT use the "Compose Booster" name or logo in your fork
- ✅ You MUST rebrand your distribution with a distinct name and visual identity
- ✅ You MUST comply with MPL 2.0 requirements (see LEGAL_HEADER.txt for source file headers)

### Source Code Availability

The complete source code for this application is available at:
- GitHub Repository: [https://github.com/your-username/compose-booster](https://github.com/your-username/compose-booster)

Under MPL 2.0, you have the right to:
- View, download, and study the source code
- Modify the code for your own use
- Distribute modified versions (with proper attribution and rebranding)
- Use the code in commercial projects (following MPL 2.0 terms)

## Credits

- Built with [Electron](https://www.electronjs.org/)
- Powered by [OpenRouter](https://openrouter.ai/)
- Uses AI models from Anthropic, OpenAI, Google, Meta, and Mistral

## Support

- 📖 [Documentation](https://github.com/your-repo/wiki)
- 🐛 [Report Issues](https://github.com/your-repo/issues)
- 💬 [Discussions](https://github.com/your-repo/discussions)

---

**Made with ⚡ by Compose Booster Team**
