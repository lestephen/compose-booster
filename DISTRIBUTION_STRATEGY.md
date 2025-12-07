# Electron App Distribution & Code Signing Strategy

## Overview

This document outlines the distribution and code signing approach for this Electron application. This strategy balances cost-effectiveness with user trust and update capabilities.

## Distribution Channels

### 1. GitHub Releases (Primary)
- **Platforms**: Windows, macOS
- **Update Method**: electron-updater with auto-updates
- **Frequency**: As needed for bug fixes and features

### 2. Microsoft Store (Secondary)
- **Platform**: Windows only
- **Update Method**: Microsoft Store managed updates
- **Frequency**: Major releases and significant updates

## Code Signing Strategy

### Windows

#### GitHub Distribution
- **Signing**: UNSIGNED
- **Approach**: Reputation-based trust
- **Format**: NSIS installer (.exe)
- **Auto-Updates**: Enabled via electron-updater
- **User Experience**: 
  - Initial installation shows SmartScreen warning
  - Users must click "More info" → "Run anyway"
  - Over time, reputation builds and warnings decrease

#### Microsoft Store Distribution
- **Signing**: Signed by Microsoft during submission process
- **Format**: MSIX package
- **Auto-Updates**: DISABLED (Store manages updates)
- **User Experience**: 
  - No security warnings
  - Automatic updates via Store
  - Sandboxed environment

### macOS

#### GitHub Distribution
- **Signing**: SIGNED with Apple Developer certificate
- **Developer Account**: Apple Developer Program ($99/year)
- **Certificate Type**: Developer ID Application
- **Notarization**: Required and enabled
- **Format**: DMG installer
- **Auto-Updates**: Enabled via electron-updater
- **User Experience**: No security warnings

## Build Configurations

### Separate Builds Required

Two distinct build configurations are maintained:

1. **GitHub Build** (`electron-builder.github.json`)
   - Windows: NSIS installer, unsigned
   - macOS: DMG, signed and notarized
   - Auto-updater: ENABLED

2. **Microsoft Store Build** (`electron-builder.store.json`)
   - Windows: MSIX package
   - Auto-updater: DISABLED
   - Store-specific metadata and capabilities

### Build Commands

```bash
# Build for GitHub (Windows)
npm run build:github:win

# Build for GitHub (macOS)
npm run build:github:mac

# Build for Microsoft Store
npm run build:store

# Build all distributions
npm run build:all
```

## Auto-Updater Logic

### Runtime Detection

The application detects its distribution channel at runtime:

```javascript
function getDistributionChannel() {
  // Microsoft Store detection
  if (process.windowsStore || 
      (process.platform === 'win32' && process.execPath.includes('WindowsApps'))) {
    return 'microsoft-store';
  }
  return 'direct-download';
}
```

### Conditional Update Checks

```javascript
// Auto-updater is only initialized for GitHub distributions
if (shouldEnableAutoUpdater()) {
  const { autoUpdater } = require('electron-updater');
  autoUpdater.checkForUpdatesAndNotify();
}
```

## Developer Account Information

### Apple Developer Account
- **Type**: Individual
- **Name**: [Your Personal Name]
- **Cost**: $99/year
- **Purpose**: 
  - Code signing for macOS builds
  - Notarization service
  - Developer ID certificates

### Microsoft Store Account
- **Type**: Individual  
- **Name**: [Your Personal Name]
- **Cost**: $19 one-time registration fee
- **Purpose**: 
  - Publish Windows MSIX packages
  - Microsoft-provided code signing
  - Store-managed update distribution

## File Structure

```
project/
├── build/
│   ├── entitlements.mac.plist       # macOS entitlements
│   └── icon.png                      # App icon
├── scripts/
│   ├── notarize.js                   # macOS notarization script
│   └── build-all.js                  # Multi-platform build script
├── src/
│   ├── main/
│   │   ├── main.js                   # Main process
│   │   └── utils/
│   │       └── distribution.js       # Distribution detection
│   └── renderer/
├── electron-builder.github.json      # GitHub build config
├── electron-builder.store.json       # MS Store build config
└── package.json
```

## Security Considerations

### Windows Unsigned Distribution Risks

**Accepted Trade-offs:**
- Users see SmartScreen warnings initially
- Requires user action to approve installation
- No immediate trust from antivirus software

**Mitigations:**
- Clear installation instructions on GitHub
- Screenshots showing how to bypass SmartScreen
- Reputation builds over time with download count
- Microsoft Store provides signed alternative

### Why This Approach?

**Cost Analysis:**
```
Traditional Windows Code Signing: $100-400/year
Azure Trusted Signing: $120/year
Microsoft Store (individual): $19 one-time

Selected Approach for Windows:
- GitHub: $0/year (unsigned)
- MS Store: $19 one-time (Microsoft signs)
Total: $19 one-time
```

**macOS has no free alternative:**
- Apple Developer Program required: $99/year
- Notarization mandatory for distribution outside App Store
- Users cannot easily install unsigned apps (since macOS Catalina)

## Update Strategy

### GitHub Releases
1. Developer tags new version (e.g., `v1.2.0`)
2. GitHub Actions builds and signs macOS, builds Windows unsigned
3. Releases published to GitHub with auto-generated notes
4. electron-updater checks GitHub Releases API
5. Users prompted to download and install updates
6. macOS: Updates install seamlessly (signed)
7. Windows: SmartScreen appears but less frequently for known app

### Microsoft Store
1. Developer submits MSIX package via Partner Center
2. Microsoft reviews (usually 1-3 days)
3. Store signs package with Microsoft certificate
4. Users receive automatic updates via Store
5. No user action required

## Implementation Checklist

### Initial Setup
- [ ] Register Apple Developer account ($99/year)
- [ ] Register Microsoft Store developer account ($19 one-time)
- [ ] Generate Apple Developer ID certificate
- [ ] Configure GitHub repository for releases
- [ ] Set up GitHub Actions secrets (Apple credentials)
- [ ] Create both build configuration files
- [ ] Implement distribution detection logic
- [ ] Test auto-updater on both platforms

### Each Release
- [ ] Update version in `package.json`
- [ ] Create git tag (e.g., `git tag v1.2.0`)
- [ ] Push tag to trigger GitHub Actions
- [ ] Verify GitHub release published correctly
- [ ] Build Microsoft Store package locally
- [ ] Submit MSIX to Microsoft Partner Center
- [ ] Monitor Store certification status
- [ ] Test updates on all distribution channels

## Environment Variables

### Required for macOS Signing (GitHub Actions)

```bash
APPLE_ID=your-apple-id@email.com
APPLE_ID_PASSWORD=app-specific-password
APPLE_TEAM_ID=YOUR10CHARS
CSC_LINK=base64-encoded-certificate.p12
CSC_KEY_PASSWORD=certificate-password
GH_TOKEN=github-personal-access-token
```

### Microsoft Store (Local Build)

```bash
# Usually configured via electron-builder.store.json
# Publisher info obtained from Microsoft Partner Center
```

## User Documentation Requirements

### GitHub README Installation Section

Include clear instructions for Windows users:

```markdown
### Windows Installation

**Important**: Windows SmartScreen may show a warning on first install.

1. Download the latest `.exe` from [Releases](releases)
2. Run the installer
3. If you see "Windows protected your PC":
   - Click "More info"
   - Click "Run anyway"
4. This is normal for new unsigned applications
5. Alternatively, install from [Microsoft Store](link) for a warning-free experience
```

### Auto-Update Notifications

UI should clearly communicate:
- Update availability
- Download progress (for GitHub version)
- Installation prompts
- Store-managed updates (for Store version)

## Future Considerations

### If Revenue Justifies ($10k+/year)

Consider upgrading to:
- **Windows**: Azure Trusted Signing ($120/year) for GitHub builds
- **Business Entity**: DBA or LLC if liability protection needed
- **EV Certificate**: For instant trust ($300-500/year)

### Metrics to Track

- GitHub release download counts
- Microsoft Store install/update metrics
- User reports of SmartScreen issues
- Support requests related to installation

---

## Summary

**Total Annual Cost**: $99/year (Apple Developer Program only)

**Distribution Matrix**:

| Platform | Channel | Signed | Auto-Update | Cost |
|----------|---------|--------|-------------|------|
| Windows  | GitHub  | No     | Yes (electron-updater) | $0 |
| Windows  | MS Store | Yes (by MS) | Yes (by Store) | $19 one-time |
| macOS    | GitHub  | Yes    | Yes (electron-updater) | $99/year |

This approach prioritizes:
1. **Cost-effectiveness** for an individual developer
2. **User experience** through multiple distribution options
3. **Professional macOS support** with proper signing
4. **Flexibility** with both direct and store distributions