import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.socialscopecoach.app',
  appName: 'SocialScope Coach',
  webDir: 'dist',
  // Match index.css --background (222 47% 6%) so there's no white flash
  // between native splash and React mount.
  backgroundColor: '#0a1020',
  // ⚠️ DO NOT COMMIT WITH server.url UNCOMMENTED — a published Play build
  // with this set will load from the Lovable sandbox instead of bundled
  // assets and break for end users.
  // server: {
  //   url: 'https://29c42402-6efd-4d75-bd72-b8324e49a11b.lovableproject.com?forceHideBadge=true',
  //   cleartext: true,
  // },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: false, // we hide it manually after React mounts
      backgroundColor: '#0a1020',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
