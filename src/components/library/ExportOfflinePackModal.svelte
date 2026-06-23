<script lang="ts">
    import { fade } from 'svelte/transition';

    export interface OfflineExportConfirmOptions {
        downloadZip: boolean;
        saveToLibrary: boolean;
        updateLibraryExportId: string | null;
    }

    export interface OfflineLibraryUpdateTarget {
        exportId: string;
        label: string;
    }

    let {
        isOpen = $bindable(false),
        busy = false,
        libraryUpdateTargets = [],
        onConfirm,
    }: {
        isOpen: boolean;
        busy: boolean;
        libraryUpdateTargets: OfflineLibraryUpdateTarget[];
        onConfirm: (options: OfflineExportConfirmOptions) => void | Promise<void>;
    } = $props();

    let downloadZip = $state(true);
    let saveToLibrary = $state(false);
    let updateLibraryExportId = $state<string | null>(null);

    $effect(() => {
        if (isOpen) {
            downloadZip = true;
            saveToLibrary = false;
            updateLibraryExportId = null;
        }
    });

    let canSubmit = $derived(downloadZip || saveToLibrary);

    function handleClose() {
        if (busy) return;
        isOpen = false;
    }

    function handleSubmit() {
        if (!canSubmit || busy) return;
        onConfirm({
            downloadZip,
            saveToLibrary,
            updateLibraryExportId: saveToLibrary ? updateLibraryExportId : null,
        });
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" transition:fade={{ duration: 150 }} onclick={handleClose}>
        <div class="bg-base-100 rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden" onclick={(e) => e.stopPropagation()}>
            <div class="flex items-center justify-between p-4 border-b border-base-200">
                <h3 class="text-lg font-bold text-base-content">Export offline pack</h3>
                <button class="btn btn-ghost btn-sm btn-square" onclick={handleClose} disabled={busy}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            
            <div class="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
                <p class="text-sm text-base-content/70">
                    Fetch the study pack once, then choose any combination: download a ZIP file and/or save or update a
                    copy in this device's offline library (IndexedDB). Updating merges new summaries and ideas from
                    the server while keeping offline chat rows that still match the text.
                </p>

                <label class="flex items-start gap-3 cursor-pointer rounded-lg border border-base-200 p-4 hover:bg-base-200 transition-colors">
                    <input
                        type="checkbox"
                        class="checkbox checkbox-primary mt-1"
                        bind:checked={downloadZip}
                        disabled={busy}
                        aria-label="Download study pack as ZIP"
                    />
                    <div>
                        <span class="block font-medium text-base-content">Download ZIP</span>
                        <span class="block text-sm text-base-content/60 mt-0.5">
                            Save manifest and book JSON as a file (share or backup).
                        </span>
                    </div>
                </label>

                <label class="flex items-start gap-3 cursor-pointer rounded-lg border border-base-200 p-4 hover:bg-base-200 transition-colors">
                    <input
                        type="checkbox"
                        class="checkbox checkbox-primary mt-1"
                        bind:checked={saveToLibrary}
                        disabled={busy}
                        aria-label="Save study pack to offline library on this device"
                    />
                    <div>
                        <span class="block font-medium text-base-content">Save to offline library</span>
                        <span class="block text-sm text-base-content/60 mt-0.5">
                            Store on this device, or update an existing saved copy of this book after new processing.
                        </span>
                    </div>
                </label>

                {#if saveToLibrary && libraryUpdateTargets.length > 0}
                    <div class="rounded-lg border border-base-200 p-4 bg-base-200/30 space-y-2 mt-4" transition:fade={{ duration: 150 }}>
                        <label for="offline-export-merge-target" class="block text-sm font-medium text-base-content">
                            Library entry
                        </label>
                        <select
                            id="offline-export-merge-target"
                            class="select select-bordered w-full bg-base-100"
                            disabled={busy}
                            bind:value={updateLibraryExportId}
                        >
                            <option value={null}>Add new library entry</option>
                            {#each libraryUpdateTargets as t}
                                <option value={t.exportId}>
                                    Update: {t.label}
                                </option>
                            {/each}
                        </select>
                        <p class="text-xs text-base-content/60">
                            Choose "Update" to refresh processed content without losing matching offline chats.
                        </p>
                    </div>
                {/if}

                {#if !canSubmit}
                    <div class="alert alert-warning py-2 text-sm" transition:fade={{ duration: 150 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <span>Select at least one option.</span>
                    </div>
                {/if}
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
                    disabled={!canSubmit || busy}
                    class="btn btn-primary"
                >
                    {#if busy}
                        <span class="loading loading-spinner loading-sm"></span>
                        Working…
                    {:else}
                        Run export
                    {/if}
                </button>
            </div>
        </div>
    </div>
{/if}
