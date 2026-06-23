<script lang="ts">
    import { fade } from 'svelte/transition';

    let {
        isOpen = $bindable(false),
        busy = false,
        bookTitle = '',
        onConfirm,
    }: {
        isOpen: boolean;
        busy?: boolean;
        bookTitle?: string;
        onConfirm: () => void | Promise<void>;
    } = $props();

    function handleClose() {
        if (busy) return;
        isOpen = false;
    }

    function handleSubmit() {
        if (busy) return;
        onConfirm();
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" transition:fade={{ duration: 150 }} onclick={handleClose}>
        <div class="bg-base-100 rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden" onclick={(e) => e.stopPropagation()}>
            <div class="flex items-center justify-between p-4 border-b border-base-200">
                <h3 class="text-lg font-bold text-base-content">Delete Book</h3>
                <button class="btn btn-ghost btn-sm btn-square" onclick={handleClose} disabled={busy}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            
            <div class="p-6 space-y-4">
                <p class="text-base-content">
                    Are you sure you want to delete <span class="font-bold text-base-content">"{bookTitle}"</span>?
                </p>
                <p class="text-sm text-error/80">
                    This action cannot be undone. All processing data and notes associated with this book will be permanently removed.
                </p>
            </div>

            <div class="flex justify-end gap-2 p-4 border-t border-base-200 bg-base-200/30">
                <button
                    type="button"
                    onclick={handleClose}
                    disabled={busy}
                    class="btn btn-ghost"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onclick={handleSubmit}
                    disabled={busy}
                    class="btn btn-error"
                >
                    {#if busy}
                        <span class="loading loading-spinner loading-sm"></span>
                        Deleting…
                    {:else}
                        Delete
                    {/if}
                </button>
            </div>
        </div>
    </div>
{/if}
