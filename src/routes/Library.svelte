<script lang="ts">
    import BookCard from '../components/library/BookCard.svelte';
    import LoadingBookCard from '../components/library/LoadingBookCard.svelte';
    import { navigate } from '../lib/navigation';
    import { createLibraryStore } from '$lib/stores/library.svelte';

    const library = createLibraryStore();
</script>

<div class="py-4">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
            <h1 class="text-3xl font-bold text-base-content mb-1">Your Library</h1>
            <p class="text-base-content/60">Manage and read your uploaded books</p>
        </div>
        <button class="btn btn-primary" onclick={() => navigate('/upload')}>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
            Add New Book
        </button>
    </div>

    <!-- Grid -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {#if library.isLoading}
            <LoadingBookCard />
            <LoadingBookCard />
            <LoadingBookCard />
            <LoadingBookCard />
            <LoadingBookCard />
        {:else if library.books.length === 0 && library.pendingJobs.length === 0}
            <div class="col-span-full py-12 text-center text-base-content/50">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                <p>No books in your library yet.</p>
            </div>
        {:else}
            {#each library.books as book (book.id)}
                <BookCard {book} onRead={() => navigate('/read/' + book.id)} />
            {/each}
        {/if}
        
        {#each library.pendingJobs as _}
            <LoadingBookCard />
        {/each}
    </div>
</div>
