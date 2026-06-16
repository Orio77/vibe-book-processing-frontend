<script lang="ts">
    import type { Chapter } from '$lib/types';
    import { SummaryState } from './summary.svelte';
    import SummaryItem from './SummaryItem.svelte';

    let { chapter }: { chapter: Chapter } = $props();

    let state = new SummaryState(() => chapter);
</script>

<div class="flex flex-col h-full overflow-y-auto p-4 space-y-6">
    <div class="flex justify-between items-center">
        <h2 class="text-xl font-bold">Chapter Summary</h2>
        <button 
            class="btn btn-primary btn-sm"
            onclick={() => state.handleGenerate()}
            disabled={state.isGenerating}
        >
            {#if state.isGenerating}
                <span class="loading loading-spinner loading-xs"></span>
                Generating...
            {:else}
                Generate
            {/if}
        </button>
    </div>

    {#if state.error}
        <div class="alert alert-error text-sm p-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{state.error}</span>
        </div>
    {/if}

    {#if state.isLoading && state.summaries.length === 0}
        <div class="space-y-3">
            <div class="skeleton h-4 w-full"></div>
            <div class="skeleton h-4 w-5/6"></div>
            <div class="skeleton h-4 w-4/5"></div>
            <div class="skeleton h-4 w-full"></div>
        </div>
    {:else if state.isGenerating && state.summaries.length === 0}
        <div class="flex flex-col items-center justify-center py-10 space-y-4 text-base-content/60">
            <span class="loading loading-spinner loading-lg text-primary"></span>
            <p>AI is reading the chapter...</p>
        </div>
    {:else if state.summaries.length > 0}
        <div class="space-y-6 pb-20">
            {#each state.summaries as summary}
                <SummaryItem {summary} />
            {/each}
        </div>
    {:else}
        <div class="flex flex-col items-center justify-center py-10 text-center space-y-3 text-base-content/60">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 mb-2 opacity-50">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <p>No summary generated yet.</p>
            <p class="text-xs">Click Generate to let AI summarize this chapter.</p>
        </div>
    {/if}
</div>
