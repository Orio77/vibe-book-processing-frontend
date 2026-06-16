<script lang="ts">
    import type { PDFChatResponse } from '$lib/types';

    let { response }: { response: PDFChatResponse } = $props();
</script>

<div class="chat chat-end mb-2">
    <div class="chat-bubble chat-bubble-primary text-sm shadow-md">
        {response.query || 'Can you explain the selected text?'}
    </div>
</div>

<div class="chat chat-start">
    <div class="chat-bubble bg-base-200 text-base-content text-sm leading-relaxed shadow-sm">
        {response.chatResponse}
    </div>
    {#if response.contextSentencesIds?.length > 0}
        <div class="chat-footer opacity-50 text-xs mt-1">
            Based on {response.contextSentencesIds.length} sentence(s)
        </div>
    {/if}
</div>
