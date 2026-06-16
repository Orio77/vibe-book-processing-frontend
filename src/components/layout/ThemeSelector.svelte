<script lang="ts">
    import { settingsStore } from "$lib/stores/settings.svelte";

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

<div class="dropdown dropdown-end">
    <div tabindex="0" role="button" class="btn btn-ghost btn-sm gap-1">
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
            <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"
            ></path>
        </svg>
    </div>
    <ul
        class="dropdown-content bg-base-200 rounded-box z-[1] w-52 p-2 shadow-2xl"
    >
        {#each themes as t (t.id)}
            <li>
                <button
                    class="w-full btn btn-sm btn-block justify-start {settingsStore.theme ===
                    t.id
                        ? 'btn-primary'
                        : 'btn-ghost'}"
                    onclick={() => settingsStore.setTheme(t.id)}
                >
                    {t.label}
                </button>
            </li>
        {/each}
    </ul>
</div>
