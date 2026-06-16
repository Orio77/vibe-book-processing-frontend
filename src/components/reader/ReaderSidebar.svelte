<script lang="ts">
    import type { PDF, Chapter, Sentence } from '$lib/types';
    import SidebarTabs from './sidebar/SidebarTabs.svelte';
    import SummaryTab from './sidebar/SummaryTab.svelte';
    import IdeasTab from './sidebar/IdeasTab.svelte';
    import ChatTab from './sidebar/ChatTab.svelte';
    import JobQueue from './sidebar/JobQueue.svelte';
    import BookCover from '../library/BookCover.svelte';
    
    let { pdf, chapters, currentChapter, isLoading, loadChapter, sentences }: {
        pdf: PDF | null,
        chapters: Chapter[],
        currentChapter: Chapter | null,
        isLoading: boolean,
        loadChapter: (chapter: Chapter) => void,
        sentences: Sentence[]
    } = $props();

    let activeTab = $state<'toc' | 'summary' | 'ideas' | 'chat'>('toc');

    function getBookColors(title: string) {
        if (!title) return { color1: 'hsl(0, 100%, 72%)', color2: 'hsl(0, 100%, 50%)' };
        let hash = 0;
        for (let i = 0; i < title.length; i++) {
            hash = title.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue1 = Math.abs((hash * 137) % 360);
        const hue2 = Math.abs((hash * 257) % 360);
        return {
            color1: `hsl(${hue1}, 100%, 72%)`,
            color2: `hsl(${hue2}, 100%, 50%)`
        };
    }

    let colors = $derived(getBookColors(pdf?.title || ''));
</script>

<div class="drawer-side z-[60] lg:top-[65px] lg:h-[calc(100vh-65px)]">
    <label for="reader-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
    <div class="w-80 md:w-96 h-full bg-base-200 text-base-content border-r border-base-300 flex flex-col overflow-hidden">
        
        <!-- Book Cover Banner -->
        {#if pdf}
            <div class="relative w-full h-32 flex-shrink-0 overflow-hidden shadow-sm flex items-center justify-center p-4">
                <div class="absolute inset-0 z-0">
                    <BookCover color1={colors.color1} color2={colors.color2} />
                </div>
                <!-- Overlay to ensure text readability -->
                <div class="absolute inset-0 bg-base-300/40 backdrop-blur-[2px] z-10"></div>
                <!-- Title over the cover -->
                <h2 class="relative z-20 font-bold text-lg md:text-xl text-center text-white drop-shadow-md line-clamp-3 leading-tight">
                    {pdf.title}
                </h2>
            </div>
        {:else if isLoading}
            <div class="w-full h-32 flex-shrink-0 skeleton rounded-none border-b border-base-300"></div>
        {/if}

        <!-- Tabs Header -->
        <div class="flex-shrink-0 border-b border-base-300">
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
