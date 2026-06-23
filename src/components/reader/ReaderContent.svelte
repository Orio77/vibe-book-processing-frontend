<script lang="ts">
    import { fly } from 'svelte/transition';
    import { settingsStore, getFontFamilyString } from '$lib/stores/settings.svelte';
    import { selectionStore } from '$lib/stores/selection.svelte';
    import { highlightsStore } from '$lib/stores/highlights.svelte';
    import type { PDF, Chapter, Sentence, IdeaWithSentences } from '$lib/types';
    import { ReaderScrollState } from './content/readerScroll.svelte';
    import SkeletonChapter from './content/SkeletonChapter.svelte';
    import ChapterNavigation from './content/ChapterNavigation.svelte';
    import SentenceSpan from './content/SentenceSpan.svelte';
    
    let { pdf, chapters, currentChapter, sentences, isLoading, isChapterLoading, loadChapter }: {
        pdf: PDF | null,
        chapters: Chapter[],
        currentChapter: Chapter | null,
        sentences: Sentence[],
        isLoading: boolean,
        isChapterLoading: boolean,
        loadChapter: (c: Chapter) => void
    } = $props();

    interface SentenceGroup {
        type: 'idea' | 'normal';
        idea?: IdeaWithSentences;
        sentences: Sentence[];
    }

    let groups = $derived.by(() => {
        const result: SentenceGroup[] = [];
        if (sentences.length === 0) return result;

        const sentenceToIdeaMap = new Map<number, IdeaWithSentences>();
        for (const idea of highlightsStore.ideas) {
            if (idea.sentences) {
                for (const s of idea.sentences) {
                    sentenceToIdeaMap.set(s.sentenceId, idea);
                }
            }
        }

        let currentGroup: SentenceGroup | null = null;

        for (const sentence of sentences) {
            const idea = sentenceToIdeaMap.get(sentence.id);
            if (idea) {
                if (currentGroup && currentGroup.type === 'idea' && currentGroup.idea?.idea.ideaId === idea.idea.ideaId) {
                    currentGroup.sentences.push(sentence);
                } else {
                    currentGroup = {
                        type: 'idea',
                        idea,
                        sentences: [sentence]
                    };
                    result.push(currentGroup);
                }
            } else {
                if (currentGroup && currentGroup.type === 'normal') {
                    currentGroup.sentences.push(sentence);
                } else {
                    currentGroup = {
                        type: 'normal',
                        sentences: [sentence]
                    };
                    result.push(currentGroup);
                }
            }
        }
        return result;
    });

    let textWidthClass = $derived(
        settingsStore.textWidth === 'narrow' ? 'max-w-2xl' :
        settingsStore.textWidth === 'wide' ? 'max-w-5xl' :
        'max-w-3xl'
    );
    let fontStyle = $derived(getFontFamilyString(settingsStore.fontFamily));

    let scrollState = new ReaderScrollState(
        () => chapters,
        () => currentChapter,
        () => isChapterLoading
    );
</script>

<svelte:window onpointerup={() => selectionStore.stopDragging()} onscroll={() => scrollState.handleScroll(currentChapter, isChapterLoading)} />



<div class="w-full {textWidthClass} transition-all duration-300 ease-in-out grid grid-cols-1">
    {#if isLoading && !pdf}
        <div class="col-start-1 row-start-1 mt-8">
            <SkeletonChapter />
        </div>
    {:else if pdf}
        {#key currentChapter?.id}
            <div 
                class="col-start-1 row-start-1 transition-all duration-200 text-base-content/90 pb-20 w-full" 
                style="font-size: {settingsStore.fontSize}px; line-height: {settingsStore.lineSpacing}; font-family: {fontStyle};"
                in:fly={{ x: 50 * scrollState.slideDirection, duration: 400, opacity: 0 }}
                out:fly={{ x: -50 * scrollState.slideDirection, duration: 400, opacity: 0 }}
            >
                <h1 class="text-3xl md:text-4xl font-bold mb-8 mt-4 text-base-content leading-tight">{currentChapter?.title || `Chapter ${currentChapter?.id }`}</h1>
                
                {#if isChapterLoading}
                    <div class="mt-4">
                        <SkeletonChapter />
                    </div>
                {:else}
                    <p class="whitespace-pre-wrap text-justify {selectionStore.isSelectionMode ? 'select-none cursor-text' : ''}">
                        {#each groups as group}
                            {#if group.type === 'idea' && !selectionStore.isSelectionMode}
                                <!-- svelte-ignore a11y_click_events_have_key_events -->
                                <!-- svelte-ignore a11y_no_static_element_interactions -->
                                <span 
                                    class="inline relative group/idea cursor-pointer bg-accent/5 hover:bg-accent/10 border-b-2 border-accent/40 hover:border-accent rounded px-1 py-0.5 mx-0.5 transition-all duration-200"
                                    onclick={() => {
                                        highlightsStore.openTab('ideas');
                                        if (group.idea) {
                                            highlightsStore.expandedIdeaId = group.idea.idea.ideaId;
                                            highlightsStore.scrollToIdea(group.idea.idea.ideaId);
                                        }
                                    }}
                                >
                                    {#each group.sentences as sentence (sentence.id)}
                                        <SentenceSpan {sentence} isGrouped={true} />
                                    {/each}
                                    
                                    {#if group.idea}
                                        <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/idea:flex flex-col items-center z-50 pointer-events-none w-56 md:w-64">
                                            <span class="bg-base-content text-base-100 text-xs rounded-lg shadow-xl p-2 text-center font-medium leading-tight whitespace-normal">
                                                <span class="text-accent font-bold block mb-1 text-[10px] uppercase tracking-wider">💡 Key Idea</span>
                                                {group.idea.idea.ideaTitle}
                                            </span>
                                            <span class="w-2 h-2 bg-base-content rotate-45 -mt-1"></span>
                                        </span>
                                    {/if}
                                </span>
                            {:else}
                                {#each group.sentences as sentence (sentence.id)}
                                    <SentenceSpan {sentence} />
                                {/each}
                            {/if}
                        {/each}
                    </p>

                    {#if currentChapter}
                        <ChapterNavigation {chapters} {currentChapter} {loadChapter} />
                    {/if}
                {/if}
            </div>
        {/key}
    {/if}
</div>
