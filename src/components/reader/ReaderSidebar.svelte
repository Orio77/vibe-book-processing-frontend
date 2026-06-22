<script lang="ts">
    import type { PDF, Chapter, Sentence } from '$lib/types';
    import SidebarTabs from './sidebar/SidebarTabs.svelte';
    import SummaryTab from './sidebar/SummaryTab.svelte';
    import IdeasTab from './sidebar/IdeasTab.svelte';
    import ChatTab from './sidebar/ChatTab.svelte';
    import JobQueue from './sidebar/JobQueue.svelte';
    import BookCover from '../library/BookCover.svelte';
    import { getSummaryByChapterId, fetchIdeasByChapterId } from '$lib/api/index';
    import { highlightsStore } from '$lib/stores/highlights.svelte';
    
    let { pdf, chapters, currentChapter, isLoading, loadChapter, sentences, isOffline }: {
        pdf: PDF | null,
        chapters: Chapter[],
        currentChapter: Chapter | null,
        isLoading: boolean,
        loadChapter: (chapter: Chapter) => void,
        sentences: Sentence[],
        isOffline: boolean
    } = $props();


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

    let chapterHasSummary = $state<Record<number, boolean>>({});
    let chapterHasIdeas = $state<Record<number, boolean>>({});

    $effect(() => {
        chapters.forEach(c => {
            if (chapterHasSummary[c.id] === undefined) {
                getSummaryByChapterId(c.id).then(res => chapterHasSummary[c.id] = res.length > 0).catch(() => {});
            }
            if (chapterHasIdeas[c.id] === undefined) {
                fetchIdeasByChapterId(c.id).then(res => chapterHasIdeas[c.id] = res.length > 0).catch(() => {});
            }
        });
    });
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
            <SidebarTabs />
        </div>

        <!-- Scrollable Content Area -->
        <div class="flex-1 overflow-hidden relative">
            {#if highlightsStore.activeTab === 'toc'}
                <ul class="menu p-4 h-full overflow-y-auto w-auto">
                    <li class="menu-title mt-2 text-base font-bold">Table of Contents</li>
                    
                    {#if isLoading && chapters.length === 0}
                        <li class="mt-4"><div class="skeleton h-8 w-full mb-2"></div></li>
                        <li><div class="skeleton h-8 w-5/6 mb-2"></div></li>
                        <li><div class="skeleton h-8 w-4/5"></div></li>
                    {:else}
                        <div class="mt-4 space-y-1">
                            {#each chapters as chapter, index}
                                <li class="mb-1">
                                    <div class="flex flex-row items-center w-full p-0 overflow-hidden rounded-lg {currentChapter?.id === chapter.id ? 'bg-primary text-primary-content font-semibold' : 'hover:bg-base-300'}">
                                        <button 
                                            class="flex-1 text-left p-3 bg-transparent border-none focus:outline-none cursor-pointer"
                                            onclick={() => {
                                                if (currentChapter?.id !== chapter.id) {
                                                    loadChapter(chapter);
                                                }
                                                const drawer = document.getElementById('reader-drawer') as HTMLInputElement;
                                                if (drawer) drawer.checked = false;
                                            }}
                                        >
                                            <span class="line-clamp-2">{chapter.title || `Chapter ${index + 1}`}</span>
                                        </button>
                                        
                                        <!-- Quick Actions -->
                                        <div class="flex items-center px-2 gap-1 transition-opacity {currentChapter?.id === chapter.id ? 'opacity-100' : 'opacity-50 hover:opacity-100'}">
                                            <!-- Summary -->
                                            <button 
                                                class="btn btn-ghost btn-xs btn-square {currentChapter?.id === chapter.id ? 'text-primary-content hover:bg-white/20' : (chapterHasSummary[chapter.id] ? 'text-primary' : 'text-base-content/50 hover:bg-base-content/20')}"
                                                title="View Summary"
                                                onclick={(e) => {
                                                    e.stopPropagation();
                                                    if (currentChapter?.id !== chapter.id) loadChapter(chapter);
                                                    highlightsStore.openTab('summary');
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>
                                            </button>
                                            
                                            <!-- Ideas -->
                                            <button 
                                                class="btn btn-ghost btn-xs btn-square {currentChapter?.id === chapter.id ? 'text-primary-content hover:bg-white/20' : (chapterHasIdeas[chapter.id] ? 'text-accent' : 'text-base-content/50 hover:bg-base-content/20')}"
                                                title="View Key Ideas"
                                                onclick={(e) => {
                                                    e.stopPropagation();
                                                    if (currentChapter?.id !== chapter.id) loadChapter(chapter);
                                                    highlightsStore.openTab('ideas');
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.829 1.508-2.336 1.145-.683 1.954-1.848 1.954-3.141a4.5 4.5 0 00-4.5-4.5h-2.25a4.5 4.5 0 00-4.5 4.5c0 1.293.809 2.458 1.954 3.141.85.507 1.508 1.353 1.508 2.336v.192M10.5 22.5h3" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            {/each}
                        </div>
                    {/if}
                </ul>
            {:else if highlightsStore.activeTab === 'summary'}
                {#if currentChapter}
                    <SummaryTab chapter={currentChapter} />
                {:else}
                    <div class="p-8 text-center text-base-content/50">Select a chapter first</div>
                {/if}
            {:else if highlightsStore.activeTab === 'ideas'}
                {#if currentChapter}
                    <IdeasTab chapter={currentChapter} {isOffline} />
                {:else}
                    <div class="p-8 text-center text-base-content/50">Select a chapter first</div>
                {/if}
            {:else if highlightsStore.activeTab === 'chat'}
                {#if currentChapter}
                    <ChatTab chapter={currentChapter} {sentences} {isOffline} />
                {:else}
                    <div class="p-8 text-center text-base-content/50">Select a chapter first</div>
                {/if}
            {/if}
        </div>

        <!-- Persistent Job Queue pinned to bottom -->
        <div class="flex-shrink-0">
            <JobQueue {chapters} />
        </div>
    </div>
</div>
