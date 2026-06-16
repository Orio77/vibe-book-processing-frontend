<script lang="ts">
    import { useLocation } from "svelte-routing";
    import Navbar from "./Navbar.svelte";
    // Importing settingsStore ensures it initializes and applies the saved theme on app load
    import { settingsStore } from "$lib/stores/settings.svelte";
    
    let { children } = $props();

    const location = useLocation();

    // One-time migration: move old 'theme' key to the settings store
    const legacyTheme = localStorage.getItem("theme");
    if (legacyTheme) {
        settingsStore.setTheme(legacyTheme);
        localStorage.removeItem("theme");
    }

    let isReader = $derived($location.pathname.startsWith('/read'));
</script>

<div class="min-h-screen bg-base-100 text-base-content flex flex-col font-sans">
    {#if $location.pathname !== '/'}
        <Navbar />
    {/if}
    <main class="flex-grow w-full {isReader ? '' : 'max-w-6xl mx-auto p-4 md:p-8'}">
        {@render children?.()}
    </main>
</div>
