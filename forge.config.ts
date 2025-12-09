import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerAppX } from '@electron-forge/maker-appx';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

// Determine if this is a Mac App Store build
const isMAS = process.env.MAS_BUILD === 'true';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    name: 'Compose Booster',
    executableName: 'Compose Booster',
    // Platform-specific icons
    icon: process.platform === 'darwin'
      ? './assets/icons/mac/icon'
      : './assets/icons/win/icon',
    // macOS specific configuration
    appBundleId: 'com.coldray.compose-booster',
    appCategoryType: 'public.app-category.productivity',
    // Code signing for macOS (uses environment variables or keychain)
    osxSign: process.platform === 'darwin' ? {
      identity: isMAS
        ? 'Apple Distribution'           // For Mac App Store
        : 'Developer ID Application',    // For GitHub distribution
      entitlements: isMAS
        ? './build/entitlements.mas.plist'
        : './build/entitlements.mac.plist',
      'entitlements-inherit': isMAS
        ? './build/entitlements.mas.inherit.plist'
        : './build/entitlements.mac.plist',
      'hardened-runtime': !isMAS,        // Hardened runtime for notarization (not MAS)
      strictVerify: false,               // Skip pre-sign verification (Electron has adhoc signature)
    } : undefined,
    // Notarization disabled - will use xcrun notarytool manually
    // osxNotarize: (process.platform === 'darwin' && !isMAS) ? {
    //   appleId: process.env.APPLE_ID || '',
    //   appleIdPassword: process.env.APPLE_ID_PASSWORD || '',
    //   teamId: 'NBW65ZYT36',
    // } : undefined,
  },
  buildIdentifier: process.arch,
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: 'ComposeBooster', // Used for installation folder and registry entries (no spaces)
      setupIcon: './assets/icons/win/icon.ico',
      iconUrl: 'https://raw.githubusercontent.com/lestephen/compose-booster/master/assets/icons/win/icon.ico', // URL for auto-update (optional)
    }),
    new MakerAppX({
      // Microsoft Store identity (from Partner Center)
      identityName: 'ColdRayLabs.ComposeBooster',
      publisher: 'CN=D41101CD-1A4E-4FB3-8255-4BA6A73D7D90',
      publisherDisplayName: 'Cold Ray Labs',
      // App metadata
      applicationDescription: 'AI-powered email composition assistant - improve, polish, and customize your emails with advanced AI models',
      backgroundColor: '#f18138', // Orange from logo
      // Assets
      assets: './assets/store',
      // Package settings
      packageName: 'ComposeBooster',
      packageDisplayName: 'Compose Booster',
      packageVersion: '1.0.0.0', // Must be x.x.x.x format for Store
      // For Store submission - don't sign with dev cert, produce unsigned package
      makeVersionWinStoreCompatible: true,
      devCert: undefined,
    }),
    new MakerZIP({}, ['darwin']),
    new MakerDMG({
      name: 'Compose Booster',
      icon: './assets/icons/mac/icon.icns',
      format: 'ULFO', // ULFO = lzfse compression, good balance of size and compatibility
    }),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
        {
          entry: 'src/preload/settingsPreload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    // Fuses temporarily disabled to debug signing issue
    // new FusesPlugin({
    //   version: FuseVersion.V1,
    //   [FuseV1Options.RunAsNode]: false,
    //   [FuseV1Options.EnableCookieEncryption]: true,
    //   [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
    //   [FuseV1Options.EnableNodeCliInspectArguments]: false,
    //   [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
    //   [FuseV1Options.OnlyLoadAppFromAsar]: true,
    // }),
  ],
};

export default config;
