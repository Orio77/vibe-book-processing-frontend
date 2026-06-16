<script lang="ts">
    import type { Chapter } from '$lib/types';
    import { IdeasState } from './ideas.svelte';
    import IdeaItem from './IdeaItem.svelte';
    import { fade } from 'svelte/transition';

    let { chapter }: { chapter: Chapter } = $props();

    // Create a new instance of the logic class, passing in a getter for the chapter
    let state = new IdeasState(() => chapter);
</script>

<div class="flex flex-col h-full overflow-y-auto p-4 space-y-6">
    <div class="flex justify-between items-center">
        <h2 class="text-xl font-bold">Key Ideas</h2>
        {#if !state.isLoading && !state.isExtracting && state.ideas.length === 0}
            <button 
                class="btn btn-primary btn-sm"
                onclick={() => state.handleExtract()}
                transition:fade={{ duration: 200 }}
            >
                Extract
            </button>
        {/if}
    </div>

    {#if state.error}
        <div class="alert alert-error text-sm p-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{state.error}</span>
        </div>
    {/if}

    {#if state.isLoading && state.ideas.length === 0}
        <div class="space-y-3">
            <div class="skeleton h-12 w-full"></div>
            <div class="skeleton h-12 w-full"></div>
            <div class="skeleton h-12 w-full"></div>
        </div>
    {:else if state.isExtracting && state.ideas.length === 0}
        <div class="flex flex-col items-center justify-center py-10 space-y-4 text-base-content/60">
            <span class="loading loading-spinner loading-lg text-primary"></span>
            <p>AI is extracting key concepts...</p>
        </div>
    {:else if state.ideas.length > 0}
        <div class="space-y-3 pb-20">
            {#each state.ideas as idea (idea.idea.ideaId)}
                <IdeaItem {idea} {state} />
            {/each}
        </div>
    {:else}
        <div class="flex flex-col items-center justify-center py-10 text-center space-y-3 text-base-content/60">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 mb-2 opacity-50">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.829 1.508-2.336 1.145-.683 1.954-1.848 1.954-3.141a4.5 4.5 0 00-4.5-4.5h-2.25a4.5 4.5 0 00-4.5 4.5c0 1.293.809 2.458 1.954 3.141.85.507 1.508 1.353 1.508 2.336v.192M10.5 22.5h3" />
            </svg>
            <p>No ideas extracted yet.</p>
            <p class="text-xs">Click Extract to find key concepts in this chapter.</p>
        </div>
    {/if}
</div>
