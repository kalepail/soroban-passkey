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
      launchAutoHide: false
    },
    StatusBar: {
      
    }
  }
};

export default config;