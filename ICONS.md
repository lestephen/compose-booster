# Application Icons

## Required Icons

For proper distribution, the application needs icons in the following formats:

### Windows (.ico)
- **icon.ico** - 256x256, 128x128, 64x64, 48x48, 32x32, 16x16 (multi-resolution)
- Place in: `assets/icons/win/icon.ico`

### macOS (.icns)
- **icon.icns** - 1024x1024, 512x512, 256x256, 128x128, 64x64, 32x32, 16x16
- Place in: `assets/icons/mac/icon.icns`

### Linux (.png)
- **icon.png** - 512x512 PNG
- Place in: `assets/icons/png/`

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

## Tools for Icon Generation

### Online Tools
- **IconKitchen** - https://icon.kitchen/
- **App Icon Generator** - https://appicon.co/
- **CloudConvert** - https://cloudconvert.com/ (format conversion)

### Desktop Tools
- **Figma** - Design the base icon
- **Adobe Illustrator** - Vector design
- **GIMP** - Free alternative
- **ImageMagick** - Command-line conversion

## Example Generation Process

1. **Create base design** at 1024x1024 in Figma/Illustrator
2. **Export as PNG** at various sizes
3. **Convert to .ico** using ImageMagick:
   ```bash
   convert icon-256.png icon-128.png icon-64.png icon-32.png icon-16.png icon.ico
   ```
4. **Convert to .icns** using `png2icns`:
   ```bash
   png2icns icon.icns icon-1024.png icon-512.png icon-256.png icon-128.png icon-64.png icon-32.png icon-16.png
   ```

## Update Forge Configuration

Once icons are created, update `forge.config.ts`:

```typescript
{
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        setupIcon: 'assets/icons/win/icon.ico',
        iconUrl: 'https://example.com/icon.ico'
      }
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        icon: 'assets/icons/mac/icon.icns',
        background: 'assets/dmg-background.png'
      }
    }
  ]
}
```

## Temporary Placeholder

Until custom icons are created, Electron Forge will use default icons.

## TODO
- [ ] Design base icon concept
- [ ] Create 1024x1024 master PNG
- [ ] Generate Windows .ico file
- [ ] Generate macOS .icns file
- [ ] Generate Linux .png files
- [ ] Update forge.config.ts with icon paths
- [ ] Test builds with custom icons
