<script lang="ts">
    let { activeTab = $bindable() }: { activeTab: 'toc' | 'summary' | 'ideas' | 'chat' } = $props();

    const tabs = [
        { id: 'toc', label: 'Chapters', icon: 'M4 6h16M4 12h16M4 18h16' },
        { id: 'summary', label: 'Outline', icon: 'M4 6h16M4 10h16M4 14h16M4 18h8' },
        { id: 'ideas', label: 'Ideas', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
        { id: 'chat', label: 'Chat', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' }
    ] as const;
</script>

<div class="tabs tabs-boxed bg-base-200">
    {#each tabs as tab}
        <button 
            class="tab p-0 flex-1 flex gap-2 transition-all duration-200 {activeTab === tab.id ? 'tab-active bg-primary text-primary-content' : 'hover:bg-base-300'}"
            onclick={() => activeTab = tab.id}
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={tab.icon} />
            </svg>
            <span class="hidden md:inline text-xs font-semibold">{tab.label}</span>
        </button>
    {/each}
</div>
