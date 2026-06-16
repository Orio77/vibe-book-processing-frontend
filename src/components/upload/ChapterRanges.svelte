<script lang="ts">
    import { slide } from 'svelte/transition';

    interface Props {
        ranges?: { id: number; startPage: number; endPage: number }[];
        file?: File | null;
        isUploading?: boolean;
        onSubmit?: (e: MouseEvent) => void;
    }

    let { 
        ranges = $bindable([]),
        file = null,
        isUploading = false,
        onSubmit = () => {}
    }: Props = $props();

    let rangeCounter = 0;

    function addRange() {
        if (ranges.length > 0 && rangeCounter === 0) {
            rangeCounter = Math.max(...ranges.map(r => r.id));
        }
        ranges = [...ranges, { id: ++rangeCounter, startPage: 1, endPage: 10 }];
    }

    function removeRange(id: number) {
        ranges = ranges.filter(r => r.id !== id);
    }
</script>

<div class="card bg-base-100 border border-base-200 shadow-sm flex-1">
    <div class="card-body p-6">
        <p class="text-sm text-base-content/60 mb-4">Specify the start and end pages for the chapters you want to extract.</p>
        
        <div class="flex flex-col gap-3 mb-4 max-h-64 overflow-y-auto pr-2">
            {#each ranges as range (range.id)}
                <div class="flex gap-2 items-end" transition:slide|local={{ duration: 250 }}>
                    <div class="form-control flex-1">
                        <label class="label py-1" for={`start-page-${range.id}`}><span class="label-text text-xs">Start</span></label>
                        <input id={`start-page-${range.id}`} type="number" min="1" class="input input-sm input-bordered w-full" bind:value={range.startPage} />
                    </div>
                    <div class="form-control flex-1">
                        <label class="label py-1" for={`end-page-${range.id}`}><span class="label-text text-xs">End</span></label>
                        <input id={`end-page-${range.id}`} type="number" min="1" class="input input-sm input-bordered w-full" bind:value={range.endPage} />
                    </div>
                    <button aria-label="Remove range" class="btn btn-sm btn-square btn-ghost text-error" onclick={() => removeRange(range.id)}>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            {/each}
        </div>

        <button class="btn btn-sm btn-outline btn-block border-dashed border-base-300 text-base-content/70 hover:bg-base-200" onclick={addRange}>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
            Add Page Range
        </button>

        <div class="divider my-4"></div>

        <button 
            class="btn btn-primary w-full" 
            disabled={!file || isUploading}
            onclick={onSubmit}
        >
            {#if isUploading}
                <span class="loading loading-spinner loading-sm"></span>
                Uploading...
            {:else}
                Start Processing
            {/if}
        </button>
    </div>
</div>
