<script lang="ts">
    import { fly } from 'svelte/transition';
    let { message, onDismiss = undefined }: { message: string | null, onDismiss?: () => void } = $props();
</script>

{#if message}
    <div class="alert alert-error shadow-sm mb-6" transition:fly={{ y: -10, duration: 200 }}>
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{message}</span>
        {#if onDismiss}
            <div>
                <button class="btn btn-sm btn-circle btn-ghost" aria-label="Dismiss error" onclick={onDismiss}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        {/if}
    </div>
{/if}
