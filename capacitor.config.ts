import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'mn.sunnylearn.app',
  appName: 'SunnyLearn',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#0c0a09',
      showSpinner: false
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#990000'
    }
  }
};

export default config;
