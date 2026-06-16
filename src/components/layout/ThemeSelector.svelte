<script lang="ts">
    import { settingsStore } from "$lib/stores/settings.svelte";
    import Dropdown from "./Dropdown.svelte";

    const themes = [
        { id: "default", label: "Default" },
        { id: "light", label: "Light" },
        { id: "dark", label: "Dark" },
        { id: "retro", label: "Retro" },
        { id: "cyberpunk", label: "Cyberpunk" },
        { id: "valentine", label: "Valentine" },
        { id: "aqua", label: "Aqua" },
    ];
</script>

<Dropdown contentClass="w-52 p-2">
    {#snippet trigger()}
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
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
            />
        </svg>
        Theme
        <svg
            width="12px"
            height="12px"
            class="inline-block h-2 w-2 fill-current opacity-60"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 2048 2048"
        >
            <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path>
        </svg>
    {/snippet}

    {#snippet content()}
        <ul class="menu menu-sm w-full p-0">
            {#each themes as t (t.id)}
                <li>
                    <button
                        class="w-full justify-start {settingsStore.theme === t.id ? 'active bg-primary text-primary-content' : ''}"
                        onclick={() => {
                            settingsStore.setTheme(t.id);
                            (document.activeElement as HTMLElement)?.blur();
                        }}
                    >
                        {t.label}
                    </button>
                </li>
            {/each}
        </ul>
    {/snippet}
</Dropdown>
