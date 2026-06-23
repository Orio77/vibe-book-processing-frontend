<script lang="ts">
    import { slide } from 'svelte/transition';
    import type { IdeaWithSentences } from '$lib/types';
    import type { IdeasState } from './ideas.svelte';
    import { highlightsStore } from '$lib/stores/highlights.svelte';

    let { idea, state }: { idea: IdeaWithSentences; state: IdeasState } = $props();

    let isExpanded = $derived(state.expandedIdea === idea.idea.ideaId);
    let explanations = $derived(state.explanations[idea.idea.ideaId] || []);
    let isExplaining = $derived(state.isExplaining(idea.idea.ideaId));

</script>

<div data-idea-id={idea.idea.ideaId} class="bg-base-100 rounded-xl shadow-sm border border-base-200 overflow-hidden">
    <button 
        class="w-full text-left p-4 hover:bg-base-200 transition-colors flex justify-between items-center font-semibold"
        onclick={() => state.toggleExpand(idea.idea.ideaId)}
    >
        <span>{idea.idea.ideaTitle}</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transform transition-transform duration-200 {isExpanded ? 'rotate-180' : ''}" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
    </button>
    
    {#if isExpanded}
        <div class="p-4 border-t border-base-200 bg-base-50" transition:slide={{ duration: 200 }}>
            {#if idea.sentences.length > 0}
                <div class="mb-4">
                    <ul class="space-y-2">
                        {#each idea.sentences as sentence}
                            <button class="text-sm text-left border-l-2 border-primary pl-3 py-1 bg-base-200/50 rounded-r cursor-pointer" 
                            onclick={() => highlightsStore.scrollToSentence(sentence.sentenceId)}>
                                {sentence.sentenceContent}
                            </button>
                        {/each}
                    </ul>
                </div>
            {/if}

            <div class="mt-4">
                <h4 class="text-xs font-bold uppercase text-base-content/50 mb-2 flex justify-between items-center">
                    AI Explanations
                    <button 
                        class="btn btn-xs btn-outline btn-primary"
                        onclick={() => state.handleExplain(idea)}
                        disabled={isExplaining}
                    >
                        {#if isExplaining}
                            <span class="loading loading-spinner loading-xs"></span>
                        {:else}
                            Explain Deeper
                        {/if}
                    </button>
                </h4>
                
                {#if explanations.length > 0}
                    <div class="space-y-3 mt-2">
                        {#each explanations as exp}
                            <div class="bg-primary/5 border border-primary/20 p-3 rounded text-sm text-base-content/90">
                                {exp.text}
                            </div>
                        {/each}
                    </div>
                {:else if !isExplaining}
                    <p class="text-xs text-base-content/40 italic">No explanations generated yet.</p>
                {/if}
            </div>
        </div>
    {/if}
</div>
