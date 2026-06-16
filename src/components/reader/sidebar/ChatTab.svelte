<script lang="ts">
    import { selectionStore } from '$lib/stores/selection.svelte';
    import type { Chapter, Sentence } from '$lib/types';
    import { slide } from 'svelte/transition';
    import { ChatState } from './chat.svelte';
    import ChatMessage from './ChatMessage.svelte';

    let { chapter, sentences }: { chapter: Chapter; sentences: Sentence[] } = $props();

    let state = new ChatState(() => chapter, () => sentences);
</script>

<div class="flex flex-col h-full overflow-hidden">
    <!-- Chat Header -->
    <div class="p-4 border-b border-base-300 shadow-sm flex-shrink-0 bg-base-100">
        <h2 class="text-xl font-bold">Chapter Chat</h2>
        <p class="text-xs text-base-content/60 mt-1">Ask questions about the current chapter.</p>
    </div>

    <!-- Messages Area -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
        {#if state.isLoading && state.responses.length === 0}
            <div class="flex justify-center p-4">
                <span class="loading loading-spinner text-primary"></span>
            </div>
        {:else if state.responses.length === 0}
            <div class="flex flex-col items-center justify-center h-full text-center space-y-3 text-base-content/60">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 mb-2 opacity-50">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
                <p>No chat history yet.</p>
                <p class="text-xs">Select text from the chapter to provide context, then ask a question below!</p>
            </div>
        {:else}
            {#each state.responses as response}
                <ChatMessage {response} />
            {/each}
        {/if}

        {#if state.isThinking}
            <div class="chat chat-start" transition:slide>
                <div class="chat-bubble bg-base-200 text-base-content text-sm flex items-center gap-2">
                    <span class="loading loading-dots loading-xs"></span>
                    Thinking...
                </div>
            </div>
        {/if}
        
        {#if state.error}
            <div class="alert alert-error text-sm p-3 mt-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{state.error}</span>
            </div>
        {/if}
    </div>

    <!-- Input Area -->
    <div class="p-4 border-t border-base-300 bg-base-100 flex-shrink-0">
        <!-- Selection Controls -->
        <div class="flex items-center justify-between mb-3">
            <label class="label cursor-pointer p-0 gap-2">
                <input 
                    type="checkbox" 
                    class="toggle toggle-primary toggle-sm" 
                    checked={selectionStore.isSelectionMode}
                    onchange={() => selectionStore.toggleSelectionMode()}
                />
                <span class="label-text text-sm font-medium">Text Selection</span>
            </label>
            
            {#if selectionStore.count > 0}
                <button 
                    class="btn btn-ghost btn-xs text-base-content/60"
                    onclick={() => selectionStore.clearSelection()}
                >
                    Clear selection
                </button>
            {/if}
        </div>

        {#if selectionStore.count > 0}
            <div class="badge badge-primary badge-outline badge-sm mb-3 w-full justify-start py-2 h-auto whitespace-normal" transition:slide>
                Context: {selectionStore.count} selected sentence{selectionStore.count === 1 ? '' : 's'}
            </div>
        {/if}
        
        <form class="flex gap-2" onsubmit={(e) => { e.preventDefault(); state.handleSend(); }}>
            <input 
                type="text" 
                placeholder={selectionStore.count > 0 ? "Ask about selected text..." : "Ask a general question..."}
                class="input input-bordered input-sm flex-1 focus:outline-primary"
                bind:value={state.query}
                disabled={state.isThinking}
            />
            <button 
                type="submit" 
                class="btn btn-primary btn-sm"
                disabled={!state.query.trim() || state.isThinking}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
            </button>
        </form>
    </div>
</div>
