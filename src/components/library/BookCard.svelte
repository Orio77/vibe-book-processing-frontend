<script lang="ts">
    import BookCover from './BookCover.svelte';

    interface Props {
        book?: {
            title: string;
            pages: number;
            date: string;
            color1?: string;
            color2?: string;
        };
        onRead?: (e: MouseEvent) => void;
        onDelete?: (e: MouseEvent) => void;
    }

    let { 
        book = { title: "", pages: 0, date: "", color1: "", color2: "" }, 
        onRead = () => {}, 
        onDelete = () => {} 
    }: Props = $props();
</script>

<div 
    class="card bg-base-100 border border-base-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col cursor-pointer group"
    role="button"
    tabindex="0"
    onclick={onRead}
    onkeydown={(e) => e.key === 'Enter' && onRead(e as any)}
>
    <!-- Book Cover -->
    <div class="relative bg-base-200/50 aspect-[3/4] flex items-center justify-center rounded-t-2xl overflow-hidden shadow-inner shrink-0">
        <BookCover color1={book.color1} color2={book.color2} />
    </div>
    
    <!-- Book Info -->
    <div class="p-4 border-t border-base-200 flex flex-col flex-grow">
        <h3 class="font-bold text-base-content mb-1 truncate" title={book.title}>{book.title}</h3>
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
            <button aria-label="Delete book" class="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:text-error hover:bg-error/10 relative z-10" onclick={(e) => { e.stopPropagation(); onDelete(e); }}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
        </div>
    </div>
</div>
