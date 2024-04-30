<script lang="ts">
    import "../app.css";
    import { onDestroy, onMount } from "svelte";
    import { SafeArea, type SafeAreaInsets } from "capacitor-plugin-safe-area";
    import { Capacitor } from "@capacitor/core";
    import { SplashScreen } from '@capacitor/splash-screen';
    import { StatusBar, Style } from '@capacitor/status-bar';
    import { NavigationBar } from '@hugotomazi/capacitor-navigation-bar'

    onDestroy(() => SafeArea.removeAllListeners());

    onMount(async () => {
        processInsets((await SafeArea.getSafeAreaInsets()).insets);

        await SafeArea.addListener("safeAreaChanged", ({ insets }) =>
            processInsets(insets),
        );

        if (Capacitor.isPluginAvailable('SplashScreen')) {
            SplashScreen.hide();
        }

        if (Capacitor.isPluginAvailable('NavigationBar')) {
            NavigationBar.setColor({ color: '#5b21b6', darkButtons: false });
            NavigationBar.setTransparency({ isTransparent: true });
        }

        if (Capacitor.isPluginAvailable('StatusBar')) {
            setTimeout(() => {
                StatusBar.setBackgroundColor({ color: '#5b21b6' });
                StatusBar.setStyle({ style: Style.Dark });
                StatusBar.setOverlaysWebView({ overlay: true });
            }, 200)
        }
    });

    function processInsets(insets: SafeAreaInsets["insets"]) {
        for (const [key, value] of Object.entries(insets)) {
            document.documentElement.style.setProperty(
                `--safe-area-inset-${key}`,
                `${value}px`,
            );
        }
    }
</script>

<div
    class="p-safe flex flex-col items-center justify-center h-dvh text-yellow-500 {!Capacitor.isNativePlatform()
        ? 'bg-white'
        : 'bg-violet-800'}"
>
    <slot />
</div>
