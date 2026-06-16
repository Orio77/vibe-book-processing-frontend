<script lang="ts">
    import { fly } from 'svelte/transition';
    import { tick } from 'svelte';
    import { settingsStore, getFontFamilyString } from '$lib/stores/settings.svelte';
    import { selectionStore } from '$lib/stores/selection.svelte';
    import type { PDF, Chapter, Sentence } from '$lib/types';
    
    let { pdf, chapters, currentChapter, sentences, isLoading, isChapterLoading, loadChapter }: {
        pdf: PDF | null,
        chapters: Chapter[],
        currentChapter: Chapter | null,
        sentences: Sentence[],
        isLoading: boolean,
        isChapterLoading: boolean,
        loadChapter: (c: Chapter) => void
    } = $props();

    let textWidthClass = $derived(
        settingsStore.textWidth === 'narrow' ? 'max-w-2xl' :
        settingsStore.textWidth === 'wide' ? 'max-w-5xl' :
        'max-w-3xl'
    );
    let fontStyle = $derived(getFontFamilyString(settingsStore.fontFamily));

    let previousChapterId = $state<number | null>(null);
    let slideDirection = $state(1);
    let scrollPositions = $state<Record<number, number>>({});

    $effect(() => {
        if (currentChapter && currentChapter.id !== previousChapterId) {
            const currIdx = chapters.findIndex(c => c.id === currentChapter?.id);
            const prevIdx = chapters.findIndex(c => c.id === previousChapterId);
            slideDirection = currIdx > prevIdx ? 1 : -1;
            previousChapterId = currentChapter.id;
        }
    });

    $effect(() => {
        // Restore scroll position when chapter finishes loading
        if (!isChapterLoading && currentChapter) {
            tick().then(() => {
                window.scrollTo({ top: scrollPositions[currentChapter!.id] || 0, behavior: 'instant' });
            });
        }
    });

    function handleScroll() {
        if (currentChapter && !isChapterLoading) {
            scrollPositions[currentChapter.id] = window.scrollY;
        }
    }
</script>

<svelte:window onpointerup={() => selectionStore.stopDragging()} onscroll={handleScroll} />



<div class="w-full {textWidthClass} transition-all duration-300 ease-in-out grid grid-cols-1">
    {#if isLoading && !pdf}
        <div class="col-start-1 row-start-1 flex flex-col gap-4 mt-8">
            <div class="skeleton h-10 w-3/4 mb-4"></div>
            <div class="skeleton h-4 w-full"></div>
            <div class="skeleton h-4 w-full"></div>
            <div class="skeleton h-4 w-5/6"></div>
            <div class="skeleton h-4 w-full mt-4"></div>
            <div class="skeleton h-4 w-4/5"></div>
        </div>
    {:else if pdf}
        {#key currentChapter?.id}
            <div 
                class="col-start-1 row-start-1 transition-all duration-200 text-base-content/90 pb-20 w-full" 
                style="font-size: {settingsStore.fontSize}px; line-height: {settingsStore.lineSpacing}; font-family: {fontStyle};"
                in:fly={{ x: 50 * slideDirection, duration: 400, opacity: 0 }}
                out:fly={{ x: -50 * slideDirection, duration: 400, opacity: 0 }}
            >
                <h1 class="text-3xl md:text-4xl font-bold mb-8 mt-4 text-base-content leading-tight">{currentChapter?.title || `Chapter ${currentChapter?.id }`}</h1>
                
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
                    <p class="whitespace-pre-wrap text-justify {selectionStore.isSelectionMode ? 'select-none cursor-text' : ''}">
                        {#each sentences as sentence (sentence.id)}
                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                            <span
                                class="transition-all duration-150 rounded
                                    {selectionStore.isSelectionMode ? 'hover:[text-shadow:0_0_8px_currentColor] cursor-pointer' : ''}
                                    {selectionStore.isSelected(sentence.id) ? 'bg-primary/20 text-primary-content' : ''}"
                                onpointerdown={(e) => {
                                    if (!selectionStore.isSelectionMode) return;
                                    e.preventDefault();
                                    try {
                                        e.currentTarget.releasePointerCapture(e.pointerId);
                                    } catch (err) {}
                                    
                                    const isCurrentlySelected = selectionStore.isSelected(sentence.id);
                                    const newMode = isCurrentlySelected ? 'deselect' : 'select';
                                    
                                    selectionStore.startDragging(newMode);
                                    
                                    if (newMode === 'select') {
                                        selectionStore.addSentence(sentence.id);
                                    } else {
                                        selectionStore.removeSentence(sentence.id);
                                    }
                                }}
                                onpointerover={(e) => {
                                    if (!selectionStore.isSelectionMode || !selectionStore.isDragging) return;
                                    selectionStore.handleDragOver(sentence.id);
                                }}
                            >
                                {sentence.content}
                            </span>{' '}
                        {/each}
                    </p>

                    {#if chapters.length > 0 && currentChapter}
                        {@const currIdx = chapters.findIndex(c => c.id === currentChapter.id)}
                        {@const prevChapter = currIdx > 0 ? chapters[currIdx - 1] : null}
                        {@const nextChapter = currIdx < chapters.length - 1 ? chapters[currIdx + 1] : null}
                        
                        <div class="flex justify-between w-full mt-16 pt-8 border-t border-base-200 gap-4">
                            {#if prevChapter}
                                <button class="btn btn-outline" onclick={() => loadChapter(prevChapter)}>
                                    &larr; {prevChapter.title || 'Previous'}
                                </button>
                            {:else}
                                <div></div>
                            {/if}

                            {#if nextChapter}
                                <button class="btn btn-outline text-right" onclick={() => loadChapter(nextChapter)}>
                                    {nextChapter.title || 'Next'} &rarr;
                                </button>
                            {:else}
                                <div></div>
                            {/if}
                        </div>
                    {/if}
                {/if}
            </div>
        {/key}
    {/if}
</div>
