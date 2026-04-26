import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.daytrip.app',
  appName: 'Daytrip',
  webDir: 'www',
  server: {
    url: 'https://daytrip-ai.com',
    cleartext: false,
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'always',
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#F5EEE3',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#F5EEE3',
    },
  },
};

export default config;
