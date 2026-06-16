<script lang="ts">
    import { stompStore } from '$lib/stores/stomp.svelte';
    import { fly } from 'svelte/transition';
    import { flip } from 'svelte/animate';

    function getJobTitle(type: string) {
        switch (type) {
            case 'PDF_UPLOAD': return 'Processing Document';
            case 'CHAPTER_SUMMARY': return 'Generating Summary';
            case 'IDEA_EXTRACTION': return 'Extracting Ideas';
            case 'IDEA_EXPLANATION': return 'Generating Explanation';
            case 'CHAT': return 'Thinking';
            default: return 'Processing';
        }
    }
</script>

{#if stompStore.activeJobs.length > 0}
    <div class="p-4 border-t border-base-300 bg-base-200" transition:fly={{ y: 20, duration: 300 }}>
        <h3 class="text-xs font-bold text-base-content/60 uppercase tracking-wider mb-3">AI Tasks Queue</h3>
        <ul class="space-y-2">
            {#each stompStore.activeJobs as job (job.id)}
                <li 
                    class="bg-base-100 p-3 rounded-lg text-sm border border-base-300 flex items-center justify-between shadow-sm"
                    animate:flip={{ duration: 300 }}
                    transition:fly={{ y: 10, duration: 200 }}
                >
                    <div class="flex items-center gap-3">
                        {#if job.status === 'QUEUED'}
                            <span class="loading loading-spinner loading-xs text-base-content/50"></span>
                        {:else if job.status === 'IN_PROGRESS'}
                            <span class="loading loading-spinner loading-sm text-primary"></span>
                        {:else if job.status === 'COMPLETED'}
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-success" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                            </svg>
                        {:else if job.status === 'FAILED'}
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-error" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                            </svg>
                        {/if}
                        <div class="flex flex-col">
                            <span class="font-medium">{getJobTitle(job.type)}</span>
                            <span class="text-xs text-base-content/60">
                                {job.status === 'QUEUED' ? 'Waiting in queue...' : 
                                 job.status === 'IN_PROGRESS' ? 'Running...' : 
                                 job.status === 'COMPLETED' ? 'Done' : 'Failed'}
                            </span>
                        </div>
                    </div>
                </li>
            {/each}
        </ul>
    </div>
{/if}
