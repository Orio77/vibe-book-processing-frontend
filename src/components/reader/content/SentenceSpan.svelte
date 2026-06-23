<script lang="ts">
    import type { Sentence } from "$lib/types";
    import { selectionStore } from "$lib/stores/selection.svelte";
    import { highlightsStore } from "$lib/stores/highlights.svelte";

    let {
        sentence,
        isGrouped = false,
    }: { sentence: Sentence; isGrouped?: boolean } = $props();
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<span
    data-sentence-id={sentence.id}
    class="transition-all duration-150 rounded
        {selectionStore.isSelectionMode
        ? 'hover:[text-shadow:0_0_8px_currentColor] cursor-pointer'
        : ''}
        {selectionStore.isSelected(sentence.id)
        ? 'bg-primary/20 text-primary-content'
        : ''}
        {!selectionStore.isSelectionMode &&
    !isGrouped &&
    !highlightsStore.chatSentenceIds.has(sentence.id) &&
    highlightsStore.ideaSentenceIds.has(sentence.id)
        ? 'border-b-2 border-dashed border-accent cursor-pointer'
        : ''}
        {!selectionStore.isSelectionMode &&
    highlightsStore.chatSentenceIds.has(sentence.id)
        ? 'border-b-2 border-dashed border-primary hover:bg-primary/10 cursor-pointer'
        : ''}
        {!selectionStore.isSelectionMode &&
    !isGrouped &&
    !highlightsStore.chatSentenceIds.has(sentence.id) &&
    highlightsStore.ideaSentenceIds.has(sentence.id)
        ? 'border-b-2 border-dashed border-accent hover:bg-accent/10 cursor-pointer'
        : ''}"
    onclick={(e) => {
        if (selectionStore.isSelectionMode) return;
        if (highlightsStore.chatSentenceIds.has(sentence.id)) {
            highlightsStore.openTab("chat");
        } else if (
            !isGrouped &&
            highlightsStore.ideaSentenceIds.has(sentence.id)
        ) {
            highlightsStore.openTab("ideas");
        }
    }}
    onpointerdown={(e) => {
        if (!selectionStore.isSelectionMode) return;
        e.preventDefault();
        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch (err) {}

        const isCurrentlySelected = selectionStore.isSelected(sentence.id);
        const newMode = isCurrentlySelected ? "deselect" : "select";

        selectionStore.startDragging(newMode);

        if (newMode === "select") {
            selectionStore.addSentence(sentence.id);
        } else {
            selectionStore.removeSentence(sentence.id);
        }
    }}
    onpointerover={(e) => {
        if (!selectionStore.isSelectionMode || !selectionStore.isDragging)
            return;
        selectionStore.handleDragOver(sentence.id);
    }}
>
    {sentence.content}
</span>{" "}
