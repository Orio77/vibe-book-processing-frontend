<script lang="ts">
    import FileDropzone from '../components/upload/FileDropzone.svelte';
    import ChapterSlider from '../components/upload/ChapterSlider.svelte';
    import { uploadPdf } from '$lib/api/features/pdf';
    import { navigate } from '../lib/navigation';
    import { addPendingUploadJobId } from '$lib/pendingUploadJobs';
    import * as pdfjsLib from 'pdfjs-dist';

    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.mjs',
        import.meta.url,
    ).toString();

    let file = $state<File | null>(null);
    let dividers = $state<number[]>([]);
    let isUploading = $state(false);
    let pdfPageCount = $state<number | null>(null);
    let fileError = $state<string | null>(null);

    $effect(() => {
        if (file) {
            dividers = [];
            validateAndLoadPdf(file);
        } else {
            pdfPageCount = null;
            fileError = null;
            dividers = [];
        }
    });

    async function validateAndLoadPdf(selected: File) {
        pdfPageCount = null;
        dividers = [];
        fileError = null;
        
        if (selected.type !== 'application/pdf') {
            fileError = 'Please upload a valid PDF file.';
            return;
        }
        if (selected.size > 50 * 1024 * 1024) {
            fileError = 'File is too large. Maximum size is 50MB.';
            return;
        }
        
        try {
            const arrayBuffer = await selected.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            pdfPageCount = pdf.numPages;
        } catch (e) {
            console.error("Failed to parse PDF", e);
            fileError = "Failed to parse PDF file.";
            pdfPageCount = null;
        }
    }

    async function submitUpload() {
        if (!file || !pdfPageCount) return;
        isUploading = true;
        try {
            const finalRanges: { startPage: number, endPage: number }[] = [];
            
            // Defensively sanitize dividers to ensure no API crashes
            const validDividers = [...new Set(dividers)]
                .filter(d => d > 1 && d <= pdfPageCount)
                .sort((a, b) => a - b);
                
            const boundaries = [1, ...validDividers, pdfPageCount + 1];
            
            for (let i = 0; i < boundaries.length - 1; i++) {
                finalRanges.push({
                    startPage: boundaries[i],
                    endPage: boundaries[i + 1] - 1
                });
            }

            const res = await uploadPdf(file, finalRanges);
            if (res.mode === 'queued') {
                addPendingUploadJobId(res.jobId);
            }
            navigate('/library');
        } catch (e) {
            console.error("Upload failed", e);
            alert("Upload failed. Check console for details.");
            isUploading = false;
        }
    }
</script>

<div class="max-w-4xl mx-auto py-8">
    <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold text-base-content mb-2">Upload New PDF</h1>
        <p class="text-base-content/60">Select a book and define its chapters for processing.</p>
    </div>

    {#if fileError}
        <div class="alert alert-error mb-6 max-w-xl mx-auto shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{fileError}</span>
        </div>
    {/if}

    <div class="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <!-- File Dropzone (Top) -->
        <div class="max-w-2xl mx-auto w-full">
            <FileDropzone bind:file hasError={!!fileError} />
        </div>

        {#if file && !fileError && pdfPageCount !== null}
            <!-- Chapter Slider (Below) -->
            <div class="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                <ChapterSlider bind:dividers totalPages={pdfPageCount} />
                
                <button 
                    class="btn btn-primary w-full max-w-sm mx-auto mt-4" 
                    disabled={!file || isUploading}
                    onclick={submitUpload}
                >
                    {#if isUploading}
                        <span class="loading loading-spinner loading-sm"></span>
                        Uploading...
                    {:else}
                        Start Processing
                    {/if}
                </button>
            </div>
        {/if}
    </div>
</div>
