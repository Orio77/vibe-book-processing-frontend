<script lang="ts">
    import { fly } from "svelte/transition";

    let { file = $bindable(null as File | null), hasError = false } = $props();

    let isDragging = $state(false);

    function handleFileDrop(e: DragEvent) {
        e.preventDefault();
        isDragging = false;
        if (e.dataTransfer?.files.length) {
            file = e.dataTransfer.files[0];
        }
    }

    function handleFileSelect(e: Event) {
        const target = e.target as HTMLInputElement;
        if (target.files?.length) {
            file = target.files[0];
        }
    }
</script>

<div
    class="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer h-64
           {isDragging
        ? 'border-primary bg-primary/10 scale-[1.02]'
        : 'border-base-300 bg-base-200/50 hover:bg-base-200'}
           {file ? (hasError ? 'border-error bg-error/5' : 'border-success bg-success/5') : ''}"
    ondragover={(e) => {
        e.preventDefault();
        isDragging = true;
    }}
    ondragleave={() => (isDragging = false)}
    ondrop={handleFileDrop}
    onclick={() => document.getElementById("file-upload")?.click()}
    role="button"
    tabindex="0"
    onkeydown={(e) =>
        e.key === "Enter" && document.getElementById("file-upload")?.click()}
>
    <input
        id="file-upload"
        type="file"
        accept="application/pdf,application/zip,.zip"
        class="hidden"
        onchange={handleFileSelect}
    />

    {#if file}
        <div
            in:fly={{ y: 20, duration: 300 }}
            class="flex flex-col items-center gap-3"
        >
            <div
                class="w-16 h-16 rounded-full flex items-center justify-center {hasError ? 'bg-error/20 text-error' : 'bg-success/20 text-success'}"
            >
                {#if hasError}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                        /></svg
                    >
                {:else}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M5 13l4 4L19 7"
                        /></svg
                    >
                {/if}
            </div>
            <div>
                <p class="font-medium text-lg truncate max-w-xs">{file.name}</p>
                <p class="text-sm text-base-content/50">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
            </div>
        </div>
    {:else}
        <div
            class="w-16 h-16 rounded-full bg-base-300 flex items-center justify-center text-base-content/50 mb-4"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                /></svg
            >
        </div>
        <p class="font-medium">Drag & drop your PDF or ZIP pack here</p>
        <p class="text-sm text-base-content/50 mt-1">
            or click to browse from your computer
        </p>
    {/if}
</div>
