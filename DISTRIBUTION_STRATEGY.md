# Electron App Distribution & Code Signing Strategy

## Overview

This document outlines the distribution and code signing approach for this Electron application. This strategy balances cost-effectiveness with user trust and update capabilities.

## Distribution Channels

### 1. GitHub Releases (Direct Download)
- **Platforms**: Windows, macOS
- **Update Method**: electron-updater with auto-updates
- **Frequency**: As needed for bug fixes and features
- **Advantage**: Immediate releases, no review process

### 2. Microsoft Store (Live ✅)
- **Platform**: Windows only
- **Store Link**: [Compose Booster on Microsoft Store](https://apps.microsoft.com/detail/9PDL4HH5TWGL)
- **Update Method**: Microsoft Store managed updates
- **Frequency**: Major releases and significant updates
- **Advantage**: Microsoft-signed, no SmartScreen warnings

### 3. Mac App Store (macOS)
- **Platform**: macOS only
- **Update Method**: Mac App Store managed updates
- **Frequency**: Major releases and significant updates
- **Advantage**: Apple-signed, sandboxed, trusted distribution

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

#### Mac App Store Distribution
- **Signing**: Signed with Apple Distribution certificate
- **Format**: .app bundle (submitted via Transporter)
- **Auto-Updates**: DISABLED (App Store manages updates)
- **Sandbox**: Required - app runs in sandboxed environment
- **Entitlements**: Restricted set for MAS compliance
- **User Experience**:
  - No security warnings
  - Automatic updates via App Store
  - Sandboxed environment

## Build Configurations

### Separate Builds Required

Multiple build configurations are maintained:

1. **GitHub Build** (via Electron Forge)
   - Windows: Squirrel installer, unsigned
   - macOS: DMG or ZIP, signed and notarized
   - Auto-updater: ENABLED

2. **Microsoft Store Build** (via Electron Forge MakerAppX)
   - Windows: APPX/MSIX package
   - Auto-updater: DISABLED
   - Store-specific metadata and capabilities

3. **Mac App Store Build** (via Electron Forge)
   - macOS: .app bundle for MAS submission
   - Auto-updater: DISABLED
   - Sandboxed with MAS entitlements
   - Submitted via Apple Transporter

### Build Commands

```bash
# Build for GitHub (Windows)
npm run make                           # Uses Squirrel maker

# Build for GitHub (macOS)
npm run make                           # Uses DMG/ZIP maker

# Build for Microsoft Store
npm run make -- --targets=@electron-forge/maker-appx
node scripts/fix-appx-manifest.js      # Fix manifest for Store

# Build for Mac App Store
npm run make:mas                       # MAS-specific build (TBD)
```

## Auto-Updater Logic

### Runtime Detection

The application detects its distribution channel at runtime:

```javascript
function getDistributionChannel() {
  // Microsoft Store detection (Windows)
  if (process.windowsStore ||
      (process.platform === 'win32' && process.execPath.includes('WindowsApps'))) {
    return 'microsoft-store';
  }

  // Mac App Store detection (macOS)
  if (process.mas ||
      (process.platform === 'darwin' && process.execPath.includes('/Applications/') &&
       process.execPath.includes('sandboxed'))) {
    return 'mac-app-store';
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
- **Status**: ACTIVE
- **Cost**: $99/year
- **Purpose**:
  - Code signing for macOS GitHub builds (Developer ID Application)
  - Notarization service for GitHub distribution
  - Mac App Store submission (Apple Distribution certificate)
  - App Store Connect access

### Microsoft Store Account
- **Type**: Individual
- **Status**: ACTIVE
- **Cost**: $19 one-time registration fee
- **Purpose**:
  - Publish Windows APPX/MSIX packages
  - Microsoft-provided code signing
  - Store-managed update distribution
  - Partner Center access

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
1. Developer submits APPX/MSIX package via Partner Center
2. Microsoft reviews (usually 1-3 days)
3. Store signs package with Microsoft certificate
4. Users receive automatic updates via Store
5. No user action required

### Mac App Store
1. Developer builds MAS package with Apple Distribution certificate
2. Submit via Apple Transporter or Xcode
3. Apple reviews (usually 1-3 days, can take longer)
4. App signed and distributed via Mac App Store
5. Users receive automatic updates via App Store
6. No user action required

## Implementation Checklist

### Initial Setup - Accounts
- [x] Register Apple Developer account ($99/year)
- [x] Register Microsoft Store developer account ($19 one-time)

### Initial Setup - Windows
- [x] Configure Electron Forge for APPX builds
- [x] Create fix-appx-manifest.js script for Store submission
- [x] Submit to Microsoft Store and get approval - **APPROVED!** ✅

### Initial Setup - macOS (GitHub)
- [x] Generate Developer ID Application certificate
- [x] Configure code signing in Electron Forge
- [x] Set up notarization script
- [x] Test signed/notarized build

### Initial Setup - Mac App Store
- [ ] Generate Apple Distribution certificate
- [ ] Create provisioning profile
- [ ] Configure MAS build in Electron Forge
- [ ] Create entitlements.mas.plist for sandbox
- [ ] Submit to Mac App Store and get approval

### Initial Setup - Auto-Updater
- [x] Implement distribution detection logic
- [ ] Integrate electron-updater for GitHub builds
- [ ] Disable auto-updater for store builds
- [ ] Test auto-updater on both platforms

### v1.0.0 Release Status
- [x] Update version in `package.json`
- [x] Create git tag (v1.0.0)
- [x] Build and test all distribution packages
- [x] Create GitHub release with assets
- [x] Submit to Microsoft Store via Partner Center - **APPROVED!** ✅
- [ ] Submit to Mac App Store via App Store Connect (pending)
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

**Total Annual Cost**: $99/year (Apple Developer Program)
**One-time Cost**: $19 (Microsoft Store registration)

**Distribution Matrix**:

| Platform | Channel | Signed | Auto-Update | Cost | Status |
|----------|---------|--------|-------------|------|--------|
| Windows  | GitHub  | No     | Yes (electron-updater) | $0 | ✅ Live |
| Windows  | [MS Store](https://apps.microsoft.com/detail/9PDL4HH5TWGL) | Yes (by MS) | Yes (by Store) | $19 one-time | ✅ Live |
| macOS    | GitHub  | Yes (notarized) | Yes (electron-updater) | $99/year | ✅ Live |
| macOS    | Mac App Store | Yes (by Apple) | Yes (by Store) | Included in $99/year | ⏳ Pending |

This approach provides:
1. **Maximum reach** through both direct download and app stores
2. **User choice** between store-managed and direct updates
3. **Professional signing** on all distribution channels
4. **Cost-effectiveness** with shared Apple Developer membership