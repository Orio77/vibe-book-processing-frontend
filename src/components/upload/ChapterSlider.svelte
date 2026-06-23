<script lang="ts">
    import { slide } from 'svelte/transition';

    let {
        totalPages = 100,
        dividers = $bindable<number[]>([]),
    }: {
        totalPages: number;
        dividers: number[];
    } = $props();

    let trackEl: HTMLDivElement | undefined = $state();
    let draggingIndex = $state<number | null>(null);

    // Get sorted dividers and append totalPages + 1 for drawing blocks
    let boundaries = $derived([1, ...dividers, totalPages + 1]);

    function getPageFromX(clientX: number): number {
        if (!trackEl) return 1;
        const rect = trackEl.getBoundingClientRect();
        let x = clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        const fraction = x / rect.width;
        // fraction 0 is page 1, fraction 1 is page totalPages+1
        const page = Math.round(1 + fraction * totalPages);
        return Math.max(1, Math.min(page, totalPages));
    }

    function handleTrackPointerDown(e: PointerEvent) {
        if (draggingIndex !== null) return;
        const target = e.target as HTMLElement;
        if (target.closest('.divider-handle')) return; // handled by handleDown

        e.preventDefault();
        const page = getPageFromX(e.clientX);
        
        // Don't add if it's already a boundary or 1 or totalPages
        if (page <= 1 || page > totalPages || dividers.includes(page)) return;

        // Insert new divider
        const newDividers = [...dividers, page].sort((a, b) => a - b);
        dividers = newDividers;
        
        // Immediately start dragging the new divider
        const newIdx = newDividers.indexOf(page);
        startDrag(newIdx, e);
    }

    function startDrag(index: number, e: PointerEvent) {
        e.preventDefault();
        e.stopPropagation();
        draggingIndex = index;

        const onPointerMove = (moveEv: PointerEvent) => {
            if (draggingIndex === null) return;
            moveEv.preventDefault();
            const page = getPageFromX(moveEv.clientX);

            // Constrain dragging: cannot cross adjacent dividers
            const minPage = draggingIndex > 0 ? dividers[draggingIndex - 1] + 1 : 2;
            const maxPage = draggingIndex < dividers.length - 1 ? dividers[draggingIndex + 1] - 1 : totalPages;
            
            const clamped = Math.max(minPage, Math.min(page, maxPage));
            dividers[draggingIndex] = clamped;
        };

        const onPointerUp = () => {
            draggingIndex = null;
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };

        window.addEventListener('pointermove', onPointerMove, { passive: false });
        window.addEventListener('pointerup', onPointerUp);
    }

    function removeDivider(index: number, e: Event) {
        e.stopPropagation();
        dividers = dividers.filter((_, i) => i !== index);
    }

    function getLeftPercent(page: number) {
        return ((page - 1) / totalPages) * 100;
    }

    function getWidthPercent(startPage: number, endPage: number) {
        return ((endPage - startPage) / totalPages) * 100;
    }
</script>

<div class="card bg-base-100 border border-base-200 shadow-sm w-full">
    <div class="card-body p-6">
        <div class="flex justify-between items-end mb-6">
            <div>
                <h3 class="font-bold text-lg">Divide into Chapters</h3>
                <p class="text-sm text-base-content/60">
                    Click the bar to add a divider. Drag to move. Double-click or right-click a divider to remove it.
                </p>
            </div>
        </div>

        <div class="relative w-full h-16 bg-base-200 rounded-lg overflow-hidden cursor-crosshair select-none touch-none border border-base-300"
             bind:this={trackEl}
             onpointerdown={handleTrackPointerDown}>
            
            <!-- Chapter Blocks -->
            {#each boundaries as bound, i}
                {#if i < boundaries.length - 1}
                    {@const start = bound}
                    {@const end = boundaries[i+1]}
                    <div
                        class="absolute top-0 bottom-0 border-r-2 border-base-100 flex flex-col justify-center items-center overflow-hidden transition-colors bg-primary/20 hover:bg-primary/30 text-primary-content"
                        style="left: {getLeftPercent(start)}%; width: {getWidthPercent(start, end)}%;"
                    >
                        {#if getWidthPercent(start, end) > 5}
                            <span class="font-bold text-sm text-base-content/80">Ch {i + 1}</span>
                            <span class="text-[10px] text-base-content/60 font-mono">{start}-{end - 1}</span>
                        {/if}
                    </div>
                {/if}
            {/each}

            <!-- Divider Handles -->
            {#each dividers as divider, i}
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                    class="divider-handle absolute top-0 bottom-0 w-4 -ml-2 cursor-col-resize group z-10 flex justify-center touch-none"
                    style="left: {getLeftPercent(divider)}%;"
                    onpointerdown={(e) => startDrag(i, e)}
                    ondblclick={(e) => removeDivider(i, e)}
                    oncontextmenu={(e) => { e.preventDefault(); removeDivider(i, e); }}
                >
                    <div class="w-1 h-full bg-base-content/20 group-hover:bg-primary transition-colors {draggingIndex === i ? 'bg-primary scale-x-150' : ''}"></div>
                    
                    <!-- Tooltip -->
                    <div class="absolute -top-8 bg-base-300 text-base-content text-xs px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-mono whitespace-nowrap {draggingIndex === i ? 'opacity-100 scale-110 -translate-y-1' : ''} transition-all duration-200">
                        Page {divider}
                    </div>
                </div>
            {/each}
        </div>

        <div class="flex justify-between mt-2 text-xs text-base-content/40 font-mono">
            <span>Page 1</span>
            <span>Page {totalPages}</span>
        </div>
    </div>
</div>
