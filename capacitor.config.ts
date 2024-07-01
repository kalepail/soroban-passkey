import type { CapacitorConfig } from '@capacitor/cli';
import { parseArgs } from 'util';

const { positionals } = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true,
});

const config: CapacitorConfig = {
  appId: 'org.sorobanbyexample.passkey',
  appName: 'SoroPass',
  webDir: 'build',
  server: positionals[0] === 'run' ? {
    cleartext: true,
    url: 'http://192.168.1.68:5173'
  } : undefined,
  backgroundColor: '#BFCBD7',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      launchFadeOutDuration: 0,
      splashFullScreen: false,
      splashImmersive: false,
      useDialog: false,
      backgroundColor: '#BFCBD7',
      launchShowDuration: 10000
    }
  }
};

export default config;