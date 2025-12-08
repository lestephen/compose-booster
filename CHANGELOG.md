# Changelog

All notable changes to Compose Booster will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Automated screenshot generation for app stores (`npm run screenshots`)
- README screenshots with high-resolution images
- Copyright header enforcement script (`npm run check-headers`)

## [1.0.0] - 2025-12-06

### Added
- Initial release of Compose Booster
- Main application window with input/output text areas
- Quick action buttons with keyboard shortcuts (Ctrl+1/2/3)
- Custom model selection via OpenRouter API
- Custom prompt templates with variable support
- Tone control for email styling
- Settings window with tabbed navigation:
  - General: API key, theme, font size
  - Models: Enable/disable and reorder AI models
  - Prompts: Create and edit custom prompts
  - Tones: Customize tone options
  - Quick Actions: Configure quick action buttons
  - Advanced: Export/import settings, reset to defaults
- Light and dark theme support (with system theme option)
- Clipboard integration (paste/copy shortcuts)
- Character counter for input text
- Mock API mode for development (`MOCK_API=true`)
- Encrypted local storage for API keys
- Windows installer (Squirrel)
- Microsoft Store package (MSIX)

### Security
- API keys stored with encryption via electron-store
- Content Security Policy ready for production
- Context isolation enabled for renderer processes

[Unreleased]: https://github.com/lestephen/compose-booster/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/lestephen/compose-booster/releases/tag/v1.0.0
