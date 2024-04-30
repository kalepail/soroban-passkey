<script lang="ts">
    import "../app.css";
    import { onDestroy, onMount } from "svelte";
    import { SafeArea, type SafeAreaInsets } from "capacitor-plugin-safe-area";
    import { Capacitor } from "@capacitor/core";

    onDestroy(() => SafeArea.removeAllListeners());

    onMount(async () => {
        processInsets((await SafeArea.getSafeAreaInsets()).insets);
        await SafeArea.addListener("safeAreaChanged", ({ insets }) =>
            processInsets(insets),
        );
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
    class="p-safe flex flex-col items-center justify-center h-dvh text-yellow-500 {Capacitor.isNativePlatform()
        ? 'bg-violet-800'
        : 'bg-white'}"
>
    <slot />
</div>
