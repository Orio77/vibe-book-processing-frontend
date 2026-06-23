<script lang="ts">
    import type { PDFChatResponse } from "$lib/types";
    import { highlightsStore } from "$lib/stores/highlights.svelte";

    let { response }: { response: PDFChatResponse } = $props();
</script>

<div class="card bg-base-100 border border-base-300 shadow-sm mb-4 text-left">
    <div class="card-body p-4 gap-2">
        <h3 class="card-title text-sm font-bold text-base-content/80">
            {#if response.query}
                [{response.query}]
            {:else}
                Explanation
            {/if}
        </h3>
        <div
            class="text-sm leading-relaxed text-base-content mt-1 whitespace-pre-wrap"
        >
            {response.chatResponse}
        </div>
        {#if response.contextSentencesIds?.length > 0}
            <button
                class="text-xs font-semibold text-primary hover:underline mt-2 text-left"
                onclick={() =>
                    highlightsStore.scrollToSentence(
                        response.contextSentencesIds[0],
                    )}
            >
                Based on {response.contextSentencesIds.length} sentence(s)
            </button>
        {/if}
    </div>
</div>
