# macOS Code Signing Status

**Branch:** `fix/mac-store-v1.0.0`
**Date:** 2025-12-08
**Status:** Troubleshooting signature verification failure

## What's Been Done

### Certificates
- Developer ID Application certificate installed and trusted
- Apple Distribution certificate installed and trusted
- Developer ID G2 intermediate certificate installed (was missing initially)
- All certificates verified with `security find-identity -v -p codesigning`

### Configuration Changes (forge.config.ts)
1. Added `osxSign` configuration with:
   - Identity selection (Developer ID Application vs Apple Distribution based on MAS_BUILD)
   - Entitlements files for GitHub and MAS builds
   - Hardened runtime for notarization
   - `strictVerify: false` to skip pre-sign verification

2. Added `osxNotarize` configuration (currently commented out for debugging)

3. FusesPlugin temporarily disabled for debugging

4. Created entitlements files:
   - `build/entitlements.mac.plist` - GitHub distribution (hardened runtime)
   - `build/entitlements.mas.plist` - Mac App Store (app sandbox)
   - `build/entitlements.mas.inherit.plist` - MAS helper processes

5. Generated macOS icons in `assets/icons/mac/`

6. Added npm scripts: `make:mac` and `make:mas`

### Apple Developer Portal Setup
- App ID registered: `com.coldray.compose-booster`
- Provisioning Profile created
- App Store Connect entry created

## Current Issue

**Error:** `nested code is modified or invalid`

The build completes and signing appears to work (Authority shows Developer ID Application), but signature verification fails:

```
Compose Booster.app: nested code is modified or invalid
file modified: .../Compose Booster Helper (GPU).app
file modified: .../Compose Booster Helper.app
file modified: .../Electron Framework.framework
... (all nested components)
```

### Observations
1. Individual components verify correctly when checked alone
2. cdhashes in CodeResources match actual file hashes
3. `TeamIdentifier=not set` on all components (unusual)
4. Error comes from `@electron/notarize/lib/check-signature.js`
5. Issue occurs even when building from non-iCloud directory (/tmp)
6. Issue persists with FusesPlugin disabled

### Theories
1. Version incompatibility between @electron/osx-sign and Electron 39
2. Something modifying files between signing and verification
3. Issue with how TeamIdentifier is being embedded

## Notarization Credentials

For manual notarization with `xcrun notarytool`:
- Apple ID: (set via APPLE_ID env var)
- App-specific password: (set via APPLE_ID_PASSWORD env var)
- Team ID: NBW65ZYT36

## Next Steps to Try

1. **Update packages:**
   ```bash
   npm update @electron-forge/cli
   npm update
   ```

2. **Try manual notarization** (bypassing @electron/notarize check):
   ```bash
   # Build first (without osxNotarize)
   npm run make:mac

   # Then notarize manually
   xcrun notarytool submit "out/arm64/make/Compose Booster.dmg" \
     --apple-id "$APPLE_ID" \
     --password "$APPLE_ID_PASSWORD" \
     --team-id NBW65ZYT36 \
     --wait
   ```

3. **Check GitHub issues** for @electron/osx-sign regarding "nested code is modified"

4. **Try different Electron version** - current is 39.2.6

## Files Modified in This Branch

- `forge.config.ts` - macOS signing configuration
- `package.json` - Added make:mac, make:mas scripts, maker-dmg dependency
- `build/entitlements.mac.plist` - GitHub distribution entitlements
- `build/entitlements.mas.plist` - Mac App Store entitlements
- `build/entitlements.mas.inherit.plist` - MAS inherit entitlements
- `assets/icons/mac/icon.icns` - macOS app icon
- `assets/icons/mac/icon.iconset/` - Icon source files
