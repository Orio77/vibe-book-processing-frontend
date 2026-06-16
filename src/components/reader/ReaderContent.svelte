<script lang="ts">
    import { settingsStore, getFontFamilyString } from '$lib/stores/settings.svelte';
    import { selectionStore } from '$lib/stores/selection.svelte';
    import type { PDF, Chapter, Sentence } from '$lib/types';
    
    let { pdf, chapters, currentChapter, sentences, isLoading, isChapterLoading }: {
        pdf: PDF | null,
        chapters: Chapter[],
        currentChapter: Chapter | null,
        sentences: Sentence[],
        isLoading: boolean,
        isChapterLoading: boolean
    } = $props();

    let textWidthClass = $derived(
        settingsStore.textWidth === 'narrow' ? 'max-w-2xl' :
        settingsStore.textWidth === 'wide' ? 'max-w-5xl' :
        'max-w-3xl'
    );
    let fontStyle = $derived(getFontFamilyString(settingsStore.fontFamily));
</script>

<svelte:window onpointerup={() => selectionStore.stopDragging()} />

<div class="w-full {textWidthClass} flex justify-start mb-4 transition-all duration-300 ease-in-out">
    <label for="reader-drawer" class="btn btn-sm btn-ghost lg:hidden mr-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-5 h-5 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
    </label>
    <div class="text-sm breadcrumbs">
        <ul>
            {#if pdf}
                <li>{pdf.title}</li>
            {:else if isLoading}
                <li><div class="skeleton h-4 w-20"></div></li>
            {/if}
        </ul>
    </div>
</div>

<div class="w-full {textWidthClass} transition-all duration-300 ease-in-out">
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
            style="font-size: {settingsStore.fontSize}px; line-height: {settingsStore.lineSpacing}; font-family: {fontStyle};"
        >
            <h1 class="text-3xl md:text-4xl font-bold mb-8 mt-4 text-base-content leading-tight">{currentChapter?.title || "Chapter"}</h1>
            
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
            {/if}
        </div>
    {/if}
</div>
