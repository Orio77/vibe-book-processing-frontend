<script lang="ts">
    import { navigate } from "../../lib/navigation";
    import { authStore } from "$lib/stores/auth.svelte";
    import ThemeSelector from "./ThemeSelector.svelte";
    import SettingsDropdown from "./SettingsDropdown.svelte";
    import { useLocation } from "svelte-routing";

    const location = useLocation();
</script>

<div class="navbar bg-base-100/95 backdrop-blur border-b border-base-200 px-2 sm:px-4 md:px-8 sticky top-0 z-50">
    <div class="flex-1 flex flex-row gap-2 sm:gap-4 md:gap-8 items-center">
        <!-- Logo -->
        <button
            class="flex items-center gap-2 cursor-pointer appearance-none bg-transparent border-none text-left"
            onclick={() => navigate("/")}
        >
            <div class="bg-primary text-primary-content p-1.5 rounded-lg">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    /></svg
                >
            </div>
            <span class="text-lg md:text-xl font-bold hidden sm:inline">BookProcessing</span>
        </button>

        <!-- Links -->
        <div class="flex gap-1 md:gap-2">
            <button
                class="btn btn-sm {$location.pathname === '/library' ? 'btn-primary' : 'btn-ghost text-base-content/70 hover:text-primary'}"
                onclick={() => navigate("/library")}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    /></svg
                >
                <span class="hidden md:inline">Library</span>
            </button>
            <button
                class="btn btn-sm {$location.pathname === '/upload' ? 'btn-primary' : 'btn-ghost text-base-content/70 hover:text-primary'}"
                onclick={() => navigate("/upload")}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    /></svg
                >
                <span class="hidden md:inline">Upload Book</span>
            </button>
        </div>
    </div>
    <div class="flex-none flex items-center gap-1">
        <SettingsDropdown />
        <ThemeSelector />
        {#if authStore.loggedIn}
            <button
                class="btn btn-sm btn-ghost text-error"
                onclick={() => authStore.logout()}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                </svg>
                <span class="hidden md:inline">Logout</span>
            </button>
        {/if}
    </div>
</div>
