export const prerender = true;

import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar } from '@capacitor/status-bar';
import { NavigationBar } from '@hugotomazi/capacitor-navigation-bar';

if (Capacitor.isPluginAvailable('SplashScreen'))
    SplashScreen.hide()

if (Capacitor.isPluginAvailable('StatusBar'))
    StatusBar.setBackgroundColor({ color: '#5b21b6' })

if (Capacitor.isPluginAvailable('NavigationBar'))
    NavigationBar.setColor({ color: '#5b21b6', darkButtons: true })