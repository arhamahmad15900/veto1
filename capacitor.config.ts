/**
 * Capacitor Configuration for Native Android (.apk) & iOS (.ipa) App Store Packaging
 * Usage:
 *   npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
 *   npm run build
 *   npx cap sync
 *   npx cap open android   # or npx cap open ios
 */
const config = {
  appId: 'com.veto.agent',
  appName: 'Agent Veto',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#070A11',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#070A11',
    },
  },
};

export default config;
