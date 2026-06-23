<script lang="ts">
    import type { Snippet } from 'svelte';
    
    let { 
        trigger,
        content,
        contentClass = "w-52 p-2"
    }: {
        trigger: Snippet,
        content: Snippet,
        contentClass?: string
    } = $props();
</script>

<div class="dropdown dropdown-end">
    <div tabindex="0" role="button" class="btn btn-ghost btn-sm gap-1 m-0">
        {@render trigger()}
    </div>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div tabindex="0" class="dropdown-content bg-base-200 border border-base-300 rounded-box z-50 shadow-2xl mt-2 {contentClass}">
        {@render content()}
    </div>
</div>
