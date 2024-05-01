export const prerender = true;
export const ssr = false;

import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { NavigationBar } from "@hugotomazi/capacitor-navigation-bar";

(async () => {
    try {
        if (Capacitor.isPluginAvailable("SplashScreen")) {
            await SplashScreen.hide();
        }

        if (Capacitor.isPluginAvailable("NavigationBar")) {
            await NavigationBar.setTransparency({ isTransparent: true })
            await NavigationBar.setColor({ color: "#5b21b6", darkButtons: false })
        }

        if (Capacitor.isPluginAvailable("StatusBar")) {
            await StatusBar.setOverlaysWebView({ overlay: true })
            await StatusBar.setBackgroundColor({ color: "#5b21b6" })
            await StatusBar.setStyle({ style: Style.Dark })
        }
    } catch { }
})()