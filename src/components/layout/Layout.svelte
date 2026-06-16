<script lang="ts">
    import { onMount } from "svelte";
    import Navbar from "./Navbar.svelte";
    let { showNavbar = true, currentRoute, navigate, children } = $props();

    onMount(() => {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme) {
            document.documentElement.setAttribute("data-theme", savedTheme);
        }
    });
</script>

<div class="min-h-screen bg-base-100 text-base-content flex flex-col font-sans">
    {#if showNavbar}
        <Navbar {currentRoute} {navigate} />
    {/if}
    <main class="flex-grow w-full max-w-6xl mx-auto p-4 md:p-8">
        {@render children?.()}
    </main>
</div>
