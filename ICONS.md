# Application Icons

## Status: ✅ COMPLETE

Application icons have been created and configured for Windows and macOS distribution.

## Implemented Icons

### ✅ Windows (.ico)
- **icon.ico** - Multi-resolution (256x256, 128x128, 64x64, 48x48, 32x32, 16x16)
- Location: `assets/icons/win/icon.ico`
- Status: Generated and configured

### ✅ PNG Source Files
- Multiple sizes: 256x256, 128x128, 64x64, 48x48, 32x32, 16x16
- Location: `assets/icons/png/`
- Status: Generated from SVG source

### ✅ SVG Master File
- **icon.svg** - Scalable master design
- Location: `assets/icons/icon.svg`
- Design: Blue envelope (#0078D4 gradient) with gold AI sparkle

### ✅ macOS (.icns)
- **icon.icns** - macOS icon bundle
- **icon.iconset/** - Source iconset folder with all required sizes
- Location: `assets/icons/mac/`
- Status: Generated and configured for both GitHub and Mac App Store distribution

### 🔜 Linux (.png)
- Status: Not needed (no Linux distribution planned currently)

## Icon Design Guidelines

**Concept:** Email + AI/Lightning bolt
- Clean, modern design
- Works well at small sizes (16x16)
- Distinct shape for taskbar/dock recognition
- Professional color scheme (blues, purples)

**Suggested Design Elements:**
- Email envelope icon
- Lightning bolt or sparkle overlay
- Gradient or solid color background
- Clear silhouette

## Automated Icon Generation

The project includes an automated icon generation script that creates all required formats from the SVG source.

### Regenerating Icons

To regenerate icons after editing `assets/icons/icon.svg`:

```bash
npm run icons
```

This script (`scripts/generate-icons.js`) will:
1. Convert SVG to multiple PNG sizes (256, 128, 64, 48, 32, 16)
2. Generate Windows .ico file from PNGs
3. Save all files to appropriate directories

### Dependencies

Icon generation uses:
- **sharp** - SVG to PNG conversion
- **png-to-ico** - PNG to .ico conversion

These are included in devDependencies and installed automatically with `npm install`.

## Forge Configuration

The `forge.config.ts` file has been configured to use the custom icons:

```typescript
const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: './assets/icons/win/icon', // Electron Forge adds .ico automatically
  },
  makers: [
    new MakerSquirrel({
      setupIcon: './assets/icons/win/icon.ico',
      iconUrl: 'https://raw.githubusercontent.com/lestephen/compose-booster/master/assets/icons/win/icon.ico',
    }),
    // ... other makers
  ],
};
```

## Icon Design

The current icon design features:
- **Base**: Blue gradient envelope (#0078D4 to #005A9E)
- **Accent**: Gold AI sparkle/lightning bolt
- **Style**: Modern, professional, easily recognizable
- **Format**: SVG master file ensures crisp scaling at all sizes

## Completed Tasks

- ✅ Design base icon concept
- ✅ Create SVG master file (better than 1024x1024 PNG - infinitely scalable)
- ✅ Generate Windows .ico file
- ✅ Generate PNG files at all required sizes
- ✅ Update forge.config.ts with icon paths
- ✅ Test Windows build with custom icons (127 MB installer created successfully)
- 🔜 Generate macOS .icns file (deferred until Apple Developer account available)
