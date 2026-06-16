<script lang="ts">
    let { isChapterLoading, sentences }: { isChapterLoading: boolean, sentences: any[] } = $props();

    let scrollY = $state(0);
    let innerHeight = $state(0);
    let scrollHeight = $state(0);

    function updateScrollHeight() {
        setTimeout(() => {
            scrollHeight = document.documentElement.scrollHeight;
        }, 50);
    }

    $effect(() => {
        if (!isChapterLoading && sentences?.length > 0) {
            updateScrollHeight();
        }
    });

    let maxScroll = $derived(Math.max(0, scrollHeight - innerHeight));
    let scrollProgress = $derived(maxScroll > 0 ? scrollY / maxScroll : 0);

    let isDraggingProgress = $state(false);

    function updateScrollFromPointer(e: PointerEvent, smooth = false) {
        if (maxScroll <= 0) return;
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, clickX / rect.width));
        window.scrollTo({ top: percentage * maxScroll, behavior: smooth ? 'smooth' : 'auto' });
    }

    function handlePointerDown(e: PointerEvent) {
        if (maxScroll <= 0) return;
        isDraggingProgress = true;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        updateScrollFromPointer(e, true);
    }

    function handlePointerMove(e: PointerEvent) {
        if (!isDraggingProgress) return;
        updateScrollFromPointer(e, false);
    }

    function handlePointerUp(e: PointerEvent) {
        if (!isDraggingProgress) return;
        isDraggingProgress = false;
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    }
</script>

<svelte:window bind:scrollY={scrollY} bind:innerHeight={innerHeight} onresize={updateScrollHeight} />

<div 
    class="fixed top-[65px] left-0 lg:left-80 right-0 z-[45] cursor-pointer group pb-8"
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
    onpointercancel={handlePointerUp}
    role="slider"
    aria-label="Reading progress"
    aria-valuenow={scrollProgress * 100}
    aria-valuemin="0"
    aria-valuemax="100"
    tabindex="0"
>
    <!-- The actual bar -->
    <div class="h-1.5 w-full bg-base-300/50 backdrop-blur transition-all group-hover:h-3 {isDraggingProgress ? 'h-3' : ''}">
        <div class="h-full bg-primary" style="width: {scrollProgress * 100}%"></div>
    </div>
</div>
