export const prerender = true;

import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { NavigationBar } from '@hugotomazi/capacitor-navigation-bar'

if (Capacitor.isPluginAvailable('SplashScreen')) {
    SplashScreen.hide();
}

if (Capacitor.isPluginAvailable('StatusBar')) {
    setTimeout(() => {
        StatusBar.setBackgroundColor({ color: '#5b21b6' });
        StatusBar.setStyle({ style: Style.Dark });
        StatusBar.setOverlaysWebView({ overlay: true });
    }, 200)
}

if (Capacitor.isPluginAvailable('NavigationBar')) {
    NavigationBar.setColor({ color: '#5b21b6', darkButtons: false });
    NavigationBar.setTransparency({ isTransparent: true });
}