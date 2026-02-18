import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sayed.gamehub',
  appName: 'GameHub',
  webDir: 'dist',
  android: {
    minWebViewVersion: 55,
    backgroundColor: '#1a0f0a',
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
