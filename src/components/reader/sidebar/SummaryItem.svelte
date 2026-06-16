<script lang="ts">
    import type { ChapterSummary } from '$lib/types';

    let { summary }: { summary: ChapterSummary } = $props();
</script>

<div class="bg-base-100 rounded-xl p-5 shadow-sm border border-base-200">
    <p class="text-sm leading-relaxed whitespace-pre-wrap">{summary.summaryText}</p>
</div>
