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
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      useDialog: true,
      splashFullScreen: true,
      backgroundColor: "#5b21b6",
    }
  }
};

export default config;