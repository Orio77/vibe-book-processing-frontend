import type React from 'react';
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { uploadPdf } from '@/lib/api';
import { ROUTES } from '@/lib/constants';
import { ErrorAlert } from '@/components/ui';
import { Dropzone, ChapterRangeEditor } from './upload';
import type { ChapterPageRange, ChapterRangeInput } from '@/types';

const PENDING_UPLOAD_JOB_IDS_KEY = 'pendingUploadJobIds';

function addPendingUploadJobId(jobId: number): void {
    try {
        const raw = globalThis.localStorage.getItem(PENDING_UPLOAD_JOB_IDS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        const ids = Array.isArray(parsed)
            ? parsed.map(Number).filter((item) => Number.isFinite(item))
            : [];

        if (!ids.includes(jobId)) {
            ids.push(jobId);
            globalThis.localStorage.setItem(PENDING_UPLOAD_JOB_IDS_KEY, JSON.stringify(ids));
        }
    } catch {
        globalThis.localStorage.setItem(PENDING_UPLOAD_JOB_IDS_KEY, JSON.stringify([jobId]));
    }
}

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url,
).toString();

function getSubmitButtonClass(file: File | null, uploading: boolean): string {
    if (!file) return 'bg-slate-300 cursor-not-allowed';
    if (uploading) return 'bg-blue-500 cursor-wait';
    return 'bg-blue-600 hover:bg-blue-700 hover:shadow-md active:scale-[0.99]';
}

const UploadPDF = () => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pageCount, setPageCount] = useState<number | null>(null);
    const [chapterRanges, setChapterRanges] = useState<ChapterRangeInput[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const navigate = useNavigate();

    // -----------------------------------------------------------------------
    // File handling
    // -----------------------------------------------------------------------

    const processFile = useCallback(async (selected: File) => {
        setFile(selected);
        setPageCount(null);
        setError(null);
        try {
            const arrayBuffer = await selected.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            setPageCount(pdf.numPages);
        } catch {
            // Non-critical: page count stays null if pdf.js can't read it
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        async (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const droppedFile = e.dataTransfer.files?.[0];
            if (droppedFile?.type === 'application/pdf') {
                await processFile(droppedFile);
            } else {
                setError('Please upload a valid PDF file.');
            }
        },
        [processFile],
    );

    const handleFileChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            if (!e.target.files?.length) return;
            await processFile(e.target.files[0]);
        },
        [processFile],
    );

    // -----------------------------------------------------------------------
    // Chapter range helpers
    // -----------------------------------------------------------------------

    const addChapterRange = () => {
        setChapterRanges((prev) => [
            ...prev,
            { startPage: '', endPage: pageCount == null ? '' : String(pageCount) },
        ]);
    };

    const updateChapterRange = (
        index: number,
        field: keyof ChapterRangeInput,
        value: string,
    ) => {
        setChapterRanges((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const removeChapterRange = (index: number) => {
        setChapterRanges((prev) => prev.filter((_, j) => j !== index));
    };

    // -----------------------------------------------------------------------
    // Upload
    // -----------------------------------------------------------------------

    const validateChapterRanges = (ranges: ChapterRangeInput[]): string | null => {
        for (let i = 0; i < ranges.length; i++) {
            const start = Number(ranges[i].startPage);
            const end = Number(ranges[i].endPage);
            if (!Number.isFinite(start) || !Number.isFinite(end) || start < 1 || end < 1) {
                return `Chapter ${i + 1}: page numbers must be positive integers.`;
            }
            if (!Number.isInteger(start) || !Number.isInteger(end)) {
                return `Chapter ${i + 1}: page numbers must be whole numbers.`;
            }
            if (start > end) {
                return `Chapter ${i + 1}: start page (${start}) cannot exceed end page (${end}).`;
            }
            if (pageCount != null && end > pageCount) {
                return `Chapter ${i + 1}: end page (${end}) exceeds the document length (${pageCount}).`;
            }
        }
        // Check for overlapping ranges
        const sorted = ranges
            .map((r, idx) => ({ start: Number(r.startPage), end: Number(r.endPage), idx }))
            .sort((a, b) => a.start - b.start);
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i].start <= sorted[i - 1].end) {
                return `Chapters ${sorted[i - 1].idx + 1} and ${sorted[i].idx + 1} have overlapping page ranges.`;
            }
        }
        return null;
    };

    const handleUpload = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!file) return;

        // Validate chapter ranges before submission
        if (chapterRanges.length > 0) {
            const validationError = validateChapterRanges(chapterRanges);
            if (validationError) {
                setError(validationError);
                return;
            }
        }

        setUploading(true);
        setError(null);

        const ranges: ChapterPageRange[] =
            chapterRanges.length > 0
                ? chapterRanges.map((r) => ({
                    startPage: Number(r.startPage),
                    endPage: Number(r.endPage),
                }))
                : [{ startPage: 1, endPage: pageCount ?? 1 }];

        try {
            const result = await uploadPdf(file, ranges);

            if (result.mode === 'queued') {
                addPendingUploadJobId(result.jobId);
                navigate(ROUTES.HOME, {
                    state: {
                        uploadInfo: {
                            mode: 'queued',
                            jobId: result.jobId,
                        },
                    },
                });
                return;
            }

            navigate(ROUTES.readById(result.pdfId));
        } catch (err: unknown) {
            console.error(err);
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setError(axiosErr.response?.data?.message ?? 'Failed to upload PDF');
        } finally {
            setUploading(false);
        }
    };

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    return (
        <div className="max-w-2xl mx-auto mt-8 sm:mt-12">
            <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-slate-200">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                        <Upload className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                        Upload Book
                    </h2>
                    <p className="text-slate-500 mt-2">
                        Add a new PDF to your library for reading and analysis
                    </p>
                </div>

                {error && <ErrorAlert message={error} />}

                <form onSubmit={handleUpload} className="space-y-8">
                    <Dropzone
                        file={file}
                        pageCount={pageCount}
                        isDragging={isDragging}
                        uploading={uploading}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onFileChange={handleFileChange}
                    />

                    <ChapterRangeEditor
                        ranges={chapterRanges}
                        uploading={uploading}
                        onAdd={addChapterRange}
                        onUpdate={updateChapterRange}
                        onRemove={removeChapterRange}
                    />

                    {/* Submit */}
                    <div className="pt-2">
                        <button
                            className={`w-full flex items-center justify-center py-3 px-4 rounded-xl text-white font-medium text-base transition-all duration-200 ${getSubmitButtonClass(file, uploading)}`}
                            type="submit"
                            disabled={!file || uploading}
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Processing Document...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5 mr-2" />
                                    Upload to Library
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UploadPDF;
