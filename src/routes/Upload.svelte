<script lang="ts">
    import FileDropzone from '../components/upload/FileDropzone.svelte';
    import ChapterSlider from '../components/upload/ChapterSlider.svelte';
    import { uploadPdf } from '$lib/api/features/pdf';
    import { navigate } from '../lib/navigation';
    import { authStore } from '$lib/stores/auth.svelte';
    import { addPendingUploadJobId } from '$lib/pendingUploadJobs';
    import { parseOfflineBundleZip, saveOfflineBundleToLibrary } from '$lib/offline';
    import ErrorAlert from '../components/common/ErrorAlert.svelte';
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

        if (selected.name.toLowerCase().endsWith('.zip') || selected.type === 'application/zip' || selected.type === 'application/x-zip-compressed') {
            try {
                isUploading = true;
                const buffer = await selected.arrayBuffer();
                const payload = await parseOfflineBundleZip(buffer);
                await saveOfflineBundleToLibrary(payload.manifest, payload.book, 1);
                navigate('/library');
            } catch (e) {
                console.error("Failed to load ZIP pack", e);
                fileError = "Failed to load offline ZIP pack: " + String(e);
            } finally {
                isUploading = false;
            }
            return;
        }
        
        if (selected.type !== 'application/pdf') {
            fileError = 'Please upload a valid PDF or offline ZIP file.';
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
        const pageCount = pdfPageCount;
        if (!file || !pageCount) return;
        isUploading = true;
        try {
            const finalRanges: { startPage: number, endPage: number }[] = [];
            
            // Defensively sanitize dividers to ensure no API crashes
            const validDividers = [...new Set(dividers)]
                .filter(d => d > 1 && d <= pageCount)
                .sort((a, b) => a - b);
                
            const boundaries = [1, ...validDividers, pageCount + 1];
            
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
            fileError = "Upload failed. Check console for details.";
            isUploading = false;
        }
    }
</script>

<div class="max-w-4xl mx-auto py-8">
    <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold text-base-content mb-2">Upload New Book</h1>
        <p class="text-base-content/60">Select a book and define its chapters for processing.</p>
        
        {#if !authStore.loggedIn}
            <div class="alert alert-warning shadow-sm max-w-xl mx-auto mt-4 py-3 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <div class="text-left">
                    <span class="block font-bold">Not Logged In</span>
                    <span class="block">You can still upload and read offline ZIP packs, but uploading and processing new PDFs requires an account.</span>
                </div>
            </div>
        {/if}
    </div>

    <div class="max-w-xl mx-auto">
        <ErrorAlert message={fileError} onDismiss={() => fileError = null} />
    </div>

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
