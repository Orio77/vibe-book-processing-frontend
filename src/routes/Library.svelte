<script lang="ts">
    import { onMount } from 'svelte';
    import BookCard from '../components/library/BookCard.svelte';
    import LoadingBookCard from '../components/library/LoadingBookCard.svelte';
    import { readPendingUploadJobIds, removePendingUploadJobId } from '../lib/pendingUploadJobs';
    import { fetchQueueJob } from '../lib/api/features/pdf';

    let { navigate = () => {} } = $props();

    // Mock data for the UI
    let books = $state([
        { title: "The Elements of Style", pages: 142, date: "6/15/2026", color1: "hsl(315, 100%, 72%)", color2: "hsl(227, 100%, 50%)" },
        { title: "Designing Data-Intensive Applications", pages: 616, date: "6/10/2026", color1: "hsl(15, 100%, 72%)", color2: "hsl(327, 100%, 50%)" },
        { title: "Refactoring UI", pages: 250, date: "5/28/2026", color1: "hsl(115, 100%, 72%)", color2: "hsl(200, 100%, 50%)" },
        { title: "HD_w_11.pdf", pages: 14, date: "6/1/2026", color1: "hsl(215, 100%, 72%)", color2: "hsl(127, 100%, 50%)" }
    ]);

    let pendingJobs = $state<number[]>([]);

    onMount(() => {
        pendingJobs = readPendingUploadJobIds();
        
        const interval = setInterval(async () => {
            if (pendingJobs.length === 0) return;
            
            for (const jobId of pendingJobs) {
                try {
                    const job = await fetchQueueJob(jobId);
                    if (job.status === 'COMPLETED' || job.status === 'FAILED' || job.status === 'CANCELLED') {
                        removePendingUploadJobId(jobId);
                        pendingJobs = pendingJobs.filter(id => id !== jobId);
                        
                        if (job.status === 'COMPLETED') {
                            books = [{ title: "New Processed Upload", pages: 100, date: new Date().toLocaleDateString(), color1: "hsl(280, 100%, 72%)", color2: "hsl(180, 100%, 50%)" }, ...books];
                        }
                    }
                } catch (e) {
                    console.error("Failed to poll job", e);
                }
            }
        }, 3000);

        return () => clearInterval(interval);
    });
</script>

<div class="py-4">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
            <h1 class="text-3xl font-bold text-base-content mb-1">Your Library</h1>
            <p class="text-base-content/60">Manage and read your uploaded books</p>
        </div>
        <button class="btn btn-primary" onclick={() => navigate('upload')}>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
            Add New Book
        </button>
    </div>

    <!-- Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {#each pendingJobs as jobId (jobId)}
            <LoadingBookCard />
        {/each}
        {#each books as book}
            <BookCard {book} />
        {/each}
    </div>
</div>
