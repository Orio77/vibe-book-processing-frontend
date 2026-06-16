<script lang="ts">
    import { onMount } from 'svelte';
    import { fetchPdf, fetchChapters, fetchSentencesInRanges } from '../lib/api/index';
    import type { PDF, Chapter, Sentence } from '../lib/types';
    import { settingsStore } from '$lib/stores/settings.svelte';
    import { navigate } from '../lib/navigation';
    
    let { id }: { id: string | number } = $props();
    
    let parsedId = $derived(
        typeof id === 'string' 
            ? Number(id.replace(/^(online|offline)-/, ''))
            : Number(id)
    );
    
    let pdf = $state<PDF | null>(null);
    let chapters = $state<Chapter[]>([]);
    let currentChapter = $state<Chapter | null>(null);
    let sentences = $state<Sentence[]>([]);
    let isLoading = $state(true);
    let isChapterLoading = $state(false);
    
    async function loadData() {
        if (!parsedId || isNaN(parsedId)) return;
        isLoading = true;
        try {
            pdf = await fetchPdf(parsedId);
            chapters = await fetchChapters(parsedId);
            if (chapters.length > 0) {
                await loadChapter(chapters[0]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            isLoading = false;
        }
    }
    
    async function loadChapter(chapter: Chapter) {
        currentChapter = chapter;
        isChapterLoading = true;
        try {
            const ranges = await fetchSentencesInRanges(parsedId, [{ startPage: chapter.startPage, endPage: chapter.endPage }]);
            sentences = ranges[0] || [];
        } catch(e) {
            console.error(e);
        } finally {
            isChapterLoading = false;
        }
    }
    
    onMount(() => {
        loadData();
    });
    
    let textWidthClass = $derived(
        settingsStore.textWidth === 'narrow' ? 'max-w-2xl' :
        settingsStore.textWidth === 'wide' ? 'max-w-5xl' :
        'max-w-3xl'
    );
</script>

<div class="drawer lg:drawer-open flex-grow">
    <input id="reader-drawer" type="checkbox" class="drawer-toggle" />
    
    <div class="drawer-content flex flex-col items-center p-4 md:p-8 bg-base-100 min-h-[calc(100vh-4rem)]">
        <div class="w-full {textWidthClass} flex justify-start mb-4">
            <label for="reader-drawer" class="btn btn-sm btn-ghost lg:hidden mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-5 h-5 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </label>
            <div class="text-sm breadcrumbs">
                <ul>
                    <li><a href="/library" onclick={(e) => { e.preventDefault(); navigate('/library'); }}>Library</a></li>
                    {#if pdf}
                        <li>{pdf.title}</li>
                    {:else if isLoading}
                        <li><div class="skeleton h-4 w-20"></div></li>
                    {/if}
                </ul>
            </div>
        </div>
        
        <div class="w-full {textWidthClass}">
            {#if isLoading && !pdf}
                <div class="flex flex-col gap-4 mt-8">
                    <div class="skeleton h-10 w-3/4 mb-4"></div>
                    <div class="skeleton h-4 w-full"></div>
                    <div class="skeleton h-4 w-full"></div>
                    <div class="skeleton h-4 w-5/6"></div>
                    <div class="skeleton h-4 w-full mt-4"></div>
                    <div class="skeleton h-4 w-4/5"></div>
                </div>
            {:else if pdf}
                <div 
                    class="transition-all duration-200 text-base-content/90 pb-20" 
                    style="font-size: {settingsStore.fontSize}px; line-height: {settingsStore.lineSpacing};"
                >
                    <h1 class="text-3xl md:text-4xl font-bold mb-8 mt-4 text-base-content leading-tight">{currentChapter?.title || pdf.title}</h1>
                    
                    {#if isChapterLoading}
                        <div class="flex flex-col gap-4">
                            <div class="skeleton h-4 w-full"></div>
                            <div class="skeleton h-4 w-full"></div>
                            <div class="skeleton h-4 w-5/6"></div>
                            <div class="skeleton h-4 w-full mt-4"></div>
                            <div class="skeleton h-4 w-full"></div>
                            <div class="skeleton h-4 w-4/5"></div>
                        </div>
                    {:else}
                        <p class="whitespace-pre-wrap font-serif text-justify">
                            {#each sentences as sentence}
                                {sentence.content}{' '}
                            {/each}
                        </p>
                    {/if}
                </div>
            {/if}
        </div>
    </div> 
    
    <div class="drawer-side z-[60] lg:top-[65px] lg:h-[calc(100vh-65px)]">
        <label for="reader-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
        <ul class="menu p-4 w-72 md:w-80 h-full bg-base-200 text-base-content border-r border-base-300 overflow-y-auto">
            <li class="menu-title mt-4 text-base font-bold">Table of Contents</li>
            
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
    </div>
</div>
