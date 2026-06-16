<script lang="ts">
    import { onMount } from "svelte";
    import { useLocation } from "svelte-routing";
    import Navbar from "./Navbar.svelte";
    
    let { children } = $props();

    const location = useLocation();

    onMount(() => {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme) {
            document.documentElement.setAttribute("data-theme", savedTheme);
        }
    });
</script>

<div class="min-h-screen bg-base-100 text-base-content flex flex-col font-sans">
    {#if $location.pathname !== '/'}
        <Navbar />
    {/if}
    <main class="flex-grow w-full max-w-6xl mx-auto p-4 md:p-8">
        {@render children?.()}
    </main>
</div>
