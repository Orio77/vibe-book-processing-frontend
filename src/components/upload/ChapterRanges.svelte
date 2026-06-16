<script lang="ts">
    import { slide } from 'svelte/transition';

    export interface RangeItem {
        id: number;
        startPage: number;
        hasCustomEnd: boolean;
        endPage: number;
    }

    interface Props {
        ranges?: RangeItem[];
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
        ranges = [...ranges, { id: ++rangeCounter, startPage: 1, hasCustomEnd: false, endPage: 10 }];
    }

    function removeRange(id: number) {
        ranges = ranges.filter(r => r.id !== id);
    }
</script>

<div class="card bg-base-100 border border-base-200 shadow-sm flex-1">
    <div class="card-body p-6">
        <p class="text-sm text-base-content/60 mb-4">Specify the start pages for your chapters. Uncovered pages will automatically be grouped into "fill-available" chapters.</p>
        
        <div class="flex flex-col gap-3 mb-4 max-h-[22rem] overflow-y-auto pr-2">
            {#each ranges as range (range.id)}
                <div class="flex gap-2 items-start bg-base-200/50 p-3 rounded-lg border border-base-300" transition:slide|local={{ duration: 250 }}>
                    <div class="form-control flex-1">
                        <label class="label py-1" for={`start-page-${range.id}`}><span class="label-text text-xs font-medium">Start Page</span></label>
                        <input id={`start-page-${range.id}`} type="number" min="1" class="input input-sm input-bordered w-full bg-base-100" bind:value={range.startPage} />
                    </div>
                    
                    <div class="flex flex-col flex-1 gap-1">
                        <label class="label py-1 cursor-pointer justify-start gap-2">
                            <input type="checkbox" class="checkbox checkbox-xs" bind:checked={range.hasCustomEnd} />
                            <span class="label-text text-xs">Custom End Page</span>
                        </label>
                        {#if range.hasCustomEnd}
                            <input id={`end-page-${range.id}`} type="number" min={range.startPage} class="input input-sm input-bordered w-full bg-base-100" bind:value={range.endPage} />
                        {:else}
                            <div class="text-xs text-base-content/50 italic h-8 flex items-center px-2 border border-transparent">
                                Auto (until next)
                            </div>
                        {/if}
                    </div>
                    
                    <button aria-label="Remove range" class="btn btn-sm btn-square btn-ghost text-error mt-6" onclick={() => removeRange(range.id)}>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            {/each}
        </div>

        <button class="btn btn-sm btn-outline btn-block border-dashed border-base-300 text-base-content/70 hover:bg-base-200" onclick={addRange}>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
            Add Chapter
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
