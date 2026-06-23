<script lang="ts">
    import BookCover from './BookCover.svelte';
    import type { UnifiedBook } from '$lib/stores/library.svelte';

    let { 
        book, 
        onRead = () => {}, 
        onDelete = () => {},
        onDownload = () => {}
    }: { 
        book: UnifiedBook; 
        onRead?: (e: Event) => void; 
        onDelete?: (e: Event) => void;
        onDownload?: (e: Event) => void;
    } = $props();
</script>

<div 
    class="card bg-base-100 border border-base-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col cursor-pointer overflow-hidden group"
    role="button"
    tabindex="0"
    onclick={onRead}
    onkeydown={(e) => e.key === 'Enter' && onRead(e as any)}
>
    <!-- Book Cover -->
    <div class="relative bg-base-200/50 aspect-[3/4] flex items-center justify-center overflow-hidden shadow-inner shrink-0">
        <BookCover color1={book.color1} color2={book.color2} />
    </div>
    
    <!-- Book Info -->
    <div class="p-4 border-t border-base-200 flex flex-col flex-grow relative">
        <h3 class="font-bold text-base-content mb-1 truncate pr-8" title={book.title}>{book.title}</h3>
        
        {#if book.isOffline}
            <div class="absolute top-4 right-4 text-base-content/40 tooltip tooltip-left" data-tip="Offline on Device">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            </div>
        {:else}
            <div class="absolute top-4 right-4 text-primary/60 tooltip tooltip-left" data-tip="Saved in Cloud">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
            </div>
        {/if}
        <p class="text-xs text-base-content/60 flex items-center gap-1.5 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {book.pages} pages
            <span>&bull;</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {book.date}
        </p>
        
        <div class="flex items-center justify-between mt-auto">
            <button class="text-primary font-medium text-sm hover:underline flex items-center gap-1">
                Read <span>&rarr;</span>
            </button>
            <div class="flex gap-1 relative z-10">
                <button aria-label="Download offline pack" class="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:text-primary hover:bg-primary/10" onclick={(e) => { e.stopPropagation(); onDownload(e); }}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </button>
                <button aria-label="Delete book" class="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:text-error hover:bg-error/10" onclick={(e) => { e.stopPropagation(); onDelete(e); }}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
        </div>
    </div>
</div>
