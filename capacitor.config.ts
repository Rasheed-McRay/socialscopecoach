import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.29c424026efd4d75bd72b8324e49a11b',
  appName: 'SocialScope Coach',
  webDir: 'dist',
  // For local hot-reload against the Lovable sandbox, temporarily uncomment:
  // server: {
  //   url: 'https://29c42402-6efd-4d75-bd72-b8324e49a11b.lovableproject.com?forceHideBadge=true',
  //   cleartext: true,
  // },
  android: {
    allowMixedContent: false,
  },
};

export default config;
