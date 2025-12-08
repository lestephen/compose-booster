# Compose Booster Roadmap

This document outlines planned features, improvements, and technical debt for future releases.

## v1.1 - Developer Experience & Automation

### Build & Release Automation

- [x] **Automated Screenshot Generation** ✅
  - ~~Add demo mode via `DEMO_MODE=true` environment variable~~ (used direct Playwright page.evaluate instead)
  - Pre-populate input/output with sample text
  - Use Playwright to automate screenshot capture
  - Generate screenshots for both Windows and macOS at required dimensions
  - Run: `npm run screenshots`, `npm run screenshots:windows`, `npm run screenshots:mac`
  - Output: `assets/store/screenshots/windows/` and `assets/store/screenshots/mac/`

- [ ] **Changelog Management**
  - Create CHANGELOG.md following Keep a Changelog format
  - Consider conventional commits for automated changelog generation
  - Link changelog entries to GitHub releases

- [x] **Copyright Header Enforcement** ✅
  - Script to check/add MPL-2.0 headers to all source files
  - Run: `npm run check-headers` (check only) or `npm run fix-headers` (auto-fix)
  - Header format:
    ```
    // This Source Code Form is subject to the terms of the Mozilla Public
    // License, v. 2.0. If a copy of the MPL was not distributed with this
    // file, You can obtain one at https://mozilla.org/MPL/2.0/.
    //
    // Copyright (c) 2025 Stephen Le
    ```

### Bug Fixes & Polish

- [ ] **DevTools Keyboard Shortcuts** (Not a bug - by design)
  - Current behavior: DevTools shortcuts only work when enabled in Settings
  - Consider: Always allow F12 but hide menu item, or document this behavior
  - Decision: Keep as-is for clean production UX

## v1.2 - Multi-Provider Support

### Provider Architecture

- [ ] **Provider Abstraction Layer**
  - Create `Provider` interface with methods: `sendRequest()`, `listModels()`, `validateApiKey()`
  - Implement `OpenRouterProvider` (current behavior)
  - Implement `OpenAICompatibleProvider` for OpenAI, Azure, etc.
  - Implement `OllamaProvider` for local models

- [ ] **Settings UI Changes**
  - Add "Providers" tab or section in Settings
  - Each provider has: name, API endpoint, API key, enabled/disabled
  - Models tab filters by selected provider
  - Support multiple API keys (one per provider)

- [ ] **Model Discovery**
  - Fetch available models from provider API
  - Cache model list locally with refresh button
  - Show model capabilities (context length, pricing if available)

### Provider-Specific Implementation

```
Providers to support:
├── OpenRouter (current) - Multiple models, pay-per-use
├── OpenAI API - Direct OpenAI access
├── Azure OpenAI - Enterprise deployments
├── Anthropic API - Direct Claude access
├── Google AI - Gemini models
├── Ollama - Local models (llama, mistral, etc.)
└── LM Studio - Local model server
```

### Technical Considerations

- API key storage: Each provider needs separate encrypted key
- Endpoint configuration: Some providers need custom base URLs
- Authentication: Different header formats (Bearer, x-api-key, etc.)
- Rate limiting: Provider-specific handling
- Error messages: Provider-specific error parsing

## v1.3 - Writing Style & Response Quality

### Writing Style Profiles

- [ ] **Style Profile Feature**
  - New "Styles" tab in Settings (or extend Tones)
  - Each style profile contains:
    - Name (e.g., "My Professional Style", "Casual Me")
    - Description/prompt addendum
    - Few-shot examples (optional)
  - Dropdown in main UI to select active style
  - Style prompt appended to system prompt

- [ ] **Style Profile Editor**
  - Text area for style description
  - Example pairs: "Original → Styled" format
  - Preview/test functionality
  - Import/export style profiles

### Response Alternatives

- [ ] **Thumbs Down / Regenerate**
  - Add thumbs down button next to output
  - On click: regenerate with higher temperature
  - Store multiple versions in memory
  - Show version selector: "Response 1 of 3" with arrows

- [ ] **Response History**
  - Keep last N responses for current session
  - Navigate between versions
  - Compare side-by-side (optional)

### Technical Implementation

```typescript
interface StyleProfile {
  id: string;
  name: string;
  description: string;  // Added to system prompt
  examples?: Array<{
    original: string;
    styled: string;
  }>;
  isDefault?: boolean;
}

interface ResponseVersion {
  id: string;
  content: string;
  temperature: number;
  timestamp: Date;
  model: string;
}
```

## v1.4 - Platform Expansion

### macOS Support

- [ ] **Apple Developer Account**
  - Enroll in Apple Developer Program ($99/year)
  - Set up code signing certificates
  - Configure notarization

- [ ] **macOS Build Pipeline**
  - Add MakerDMG or MakerPKG to forge.config.ts
  - Generate .icns file from SVG
  - Test on macOS (Intel and Apple Silicon)
  - Notarize for Gatekeeper

- [ ] **Mac App Store**
  - Similar process to Microsoft Store
  - App Store Connect setup
  - Screenshot requirements (different sizes)
  - Review guidelines compliance

### Linux Support

- [ ] **Linux Packages**
  - .deb for Debian/Ubuntu
  - .rpm for Fedora/RHEL
  - AppImage for universal
  - Snap or Flatpak (optional)

## Future Considerations

### Potential Features (Not Scheduled)

- **History/Undo**: Keep history of processed emails with undo
- **Templates**: Save common email structures
- **Batch Processing**: Process multiple emails at once
- **Browser Extension**: Chrome/Firefox extension for in-browser processing
- **Auto-update**: Squirrel auto-update for Windows (requires code signing)
- **Sync Settings**: Cloud sync for settings across devices
- **Team Features**: Shared prompts/styles for teams

### Technical Debt

- [ ] Increase test coverage (aim for 80%+)
- [ ] Add E2E tests with Playwright
- [ ] Performance profiling for large emails
- [ ] Accessibility audit (screen reader support)
- [ ] Internationalization (i18n) preparation

---

## Release Process

1. Create feature branch from `master`
2. Implement and test changes
3. Update version in `package.json`
4. Update CHANGELOG.md
5. Create PR, get review
6. Merge to `master`
7. Tag release (`git tag -a vX.Y.Z`)
8. Build installers (`npm run make`)
9. Create GitHub release with assets
10. Submit to app stores if applicable

## Contributing

See CLAUDE.md for development guidelines and coding standards.
