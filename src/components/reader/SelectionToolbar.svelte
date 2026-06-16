<script lang="ts">
    import { selectionStore } from '$lib/stores/selection.svelte';
</script>

<div class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pointer-events-auto">
    <div class="bg-base-100/90 backdrop-blur-md shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] rounded-full border border-base-content/10 px-4 py-2 flex items-center gap-4">
        
        <!-- Toggle Mode Button -->
        <div class="tooltip tooltip-top" data-tip="Toggle Sentence Selection">
            <button 
                class="btn btn-circle btn-sm {selectionStore.isSelectionMode ? 'btn-primary' : 'btn-ghost'}"
                onclick={() => selectionStore.toggleSelectionMode()}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/>
                </svg>
            </button>
        </div>

        <!-- Selection Info -->
        {#if selectionStore.isSelectionMode}
            <div class="flex items-center gap-3 border-l border-base-content/10 pl-4 transition-all duration-300">
                <span class="text-sm font-medium whitespace-nowrap min-w-24 text-center">
                    {selectionStore.count} selected
                </span>

                {#if selectionStore.count > 0}
                    <button 
                        class="btn btn-ghost btn-sm text-base-content/60"
                        onclick={() => selectionStore.clearSelection()}
                    >
                        Clear
                    </button>
                {/if}
            </div>
        {/if}
    </div>
</div>
