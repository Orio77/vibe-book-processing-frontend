<script lang="ts">
    import type { Chapter, Sentence } from '$lib/types';
    import SidebarTabs from './sidebar/SidebarTabs.svelte';
    import SummaryTab from './sidebar/SummaryTab.svelte';
    import IdeasTab from './sidebar/IdeasTab.svelte';
    import ChatTab from './sidebar/ChatTab.svelte';
    import JobQueue from './sidebar/JobQueue.svelte';
    
    let { chapters, currentChapter, isLoading, loadChapter, sentences }: {
        chapters: Chapter[],
        currentChapter: Chapter | null,
        isLoading: boolean,
        loadChapter: (chapter: Chapter) => void,
        sentences: Sentence[]
    } = $props();

    let activeTab = $state<'toc' | 'summary' | 'ideas' | 'chat'>('toc');
</script>

<div class="drawer-side z-[60] lg:top-[65px] lg:h-[calc(100vh-65px)]">
    <label for="reader-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
    <div class="w-80 md:w-96 h-full bg-base-200 text-base-content border-r border-base-300 flex flex-col overflow-hidden">
        
        <!-- Tabs Header -->
        <div class="flex-shrink-0">
            <SidebarTabs bind:activeTab />
        </div>

        <!-- Scrollable Content Area -->
        <div class="flex-1 overflow-hidden relative">
            {#if activeTab === 'toc'}
                <ul class="menu p-4 h-full overflow-y-auto">
                    <li class="menu-title mt-2 text-base font-bold">Table of Contents</li>
                    
                    {#if isLoading && chapters.length === 0}
                        <li class="mt-4"><div class="skeleton h-8 w-full mb-2"></div></li>
                        <li><div class="skeleton h-8 w-5/6 mb-2"></div></li>
                        <li><div class="skeleton h-8 w-4/5"></div></li>
                    {:else}
                        <div class="mt-4 space-y-1">
                            {#each chapters as chapter, index}
                                <li>
                                    <button 
                                        class="text-left rounded-lg transition-colors {currentChapter?.id === chapter.id ? 'active bg-primary text-primary-content font-semibold' : 'hover:bg-base-300'}"
                                        onclick={() => {
                                            if (currentChapter?.id !== chapter.id) {
                                                loadChapter(chapter);
                                            }
                                            const drawer = document.getElementById('reader-drawer') as HTMLInputElement;
                                            if (drawer) drawer.checked = false;
                                        }}
                                    >
                                        {chapter.title || `Chapter ${index + 1}`}
                                    </button>
                                </li>
                            {/each}
                        </div>
                    {/if}
                </ul>
            {:else if activeTab === 'summary'}
                {#if currentChapter}
                    <SummaryTab chapter={currentChapter} />
                {:else}
                    <div class="p-8 text-center text-base-content/50">Select a chapter first</div>
                {/if}
            {:else if activeTab === 'ideas'}
                {#if currentChapter}
                    <IdeasTab chapter={currentChapter} />
                {:else}
                    <div class="p-8 text-center text-base-content/50">Select a chapter first</div>
                {/if}
            {:else if activeTab === 'chat'}
                {#if currentChapter}
                    <ChatTab chapter={currentChapter} {sentences} />
                {:else}
                    <div class="p-8 text-center text-base-content/50">Select a chapter first</div>
                {/if}
            {/if}
        </div>

        <!-- Persistent Job Queue pinned to bottom -->
        <div class="flex-shrink-0">
            <JobQueue />
        </div>
    </div>
</div>
