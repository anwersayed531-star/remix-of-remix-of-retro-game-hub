import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e5e1967fba764de2b92f3c65be965a63',
  appName: 'Game Hub',
  webDir: 'dist',
  android: {
    minWebViewVersion: 55,
    backgroundColor: '#1a0f0a',
  },
  server: {
    url: 'https://e5e1967f-ba76-4de2-b92f-3c65be965a63.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
};

export default config;
