
import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Plus, X, AlertCircle, Loader2, BookOpen } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url,
).toString();

const API_URL = 'http://localhost:8080/api/pdf';

const UploadPDF = () => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pageCount, setPageCount] = useState<number | null>(null);
    const [chapterRanges, setChapterRanges] = useState<{ startPage: string; endPage: string }[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const navigate = useNavigate();

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === 'application/pdf') {
                await processFile(droppedFile);
            } else {
                setError('Please upload a valid PDF file.');
            }
        }
    }, []);

    const processFile = async (selected: File) => {
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
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        await processFile(e.target.files[0]);
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        setError(null);

        const ranges = chapterRanges.length > 0
            ? chapterRanges.map(r => ({ startPage: Number(r.startPage), endPage: Number(r.endPage) }))
            : [{ startPage: 1, endPage: pageCount ?? 1 }];

        const formData = new FormData();
        formData.append('file', file);
        formData.append('chapterPageRanges', new Blob([JSON.stringify(ranges)], { type: 'application/json' }));

        try {
            const response = await axios.post(`${API_URL}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            navigate(`/read/${response.data}`);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to upload PDF');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto mt-8 sm:mt-12">
            <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-slate-200">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                        <Upload className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Upload Book</h2>
                    <p className="text-slate-500 mt-2">Add a new PDF to your library for reading and analysis</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3 mb-6 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span className="block sm:inline text-sm font-medium">{error}</span>
                    </div>
                )}

                <form onSubmit={handleUpload} className="space-y-8">
                    {/* Dropzone */}
                    <div>
                        <div
                            className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl transition-all duration-200 ease-in-out
                                ${isDragging
                                    ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                                    : file
                                        ? 'border-green-300 bg-green-50/30'
                                        : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
                                }
                            `}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <input
                                id="dropzone-file"
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                accept=".pdf"
                                onChange={handleFileChange}
                                disabled={uploading}
                            />

                            <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center pointer-events-none">
                                {file ? (
                                    <>
                                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                                            <FileText className="w-6 h-6 text-green-600" />
                                        </div>
                                        <p className="text-sm font-semibold text-slate-700 mb-1 truncate max-w-[250px] sm:max-w-sm">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                                            {pageCount != null && <span className="mx-1">•</span>}
                                            {pageCount != null && <span>{pageCount} pages</span>}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <Upload className={`w-10 h-10 mb-3 ${isDragging ? 'text-blue-500 animate-bounce' : 'text-slate-400'}`} />
                                        <p className="mb-2 text-sm text-slate-600">
                                            <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                                        </p>
                                        <p className="text-xs text-slate-400">PDF documents up to 50MB</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Optional chapter ranges */}
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <label className="block text-slate-800 text-sm font-semibold">Chapter Mapping</label>
                                <p className="text-xs text-slate-500 mt-0.5">Define page ranges for better navigation (optional)</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setChapterRanges([...chapterRanges, { startPage: '', endPage: pageCount != null ? String(pageCount) : '' }])}
                                className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
                                disabled={uploading}
                            >
                                <Plus className="w-4 h-4" /> Add Chapter
                            </button>
                        </div>

                        <div className="space-y-3">
                            {chapterRanges.map((range, i) => (
                                <div key={i} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm animate-in fade-in slide-in-from-left-2">
                                    <div className="flex-1 flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">From</span>
                                            <input
                                                type="number"
                                                min="1"
                                                value={range.startPage}
                                                onChange={e => { const updated = [...chapterRanges]; updated[i].startPage = e.target.value; setChapterRanges(updated); }}
                                                className="w-full pl-12 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                disabled={uploading}
                                            />
                                        </div>
                                        <span className="text-slate-300 font-medium px-1">→</span>
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">To</span>
                                            <input
                                                type="number"
                                                min="1"
                                                value={range.endPage}
                                                onChange={e => { const updated = [...chapterRanges]; updated[i].endPage = e.target.value; setChapterRanges(updated); }}
                                                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                disabled={uploading}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setChapterRanges(chapterRanges.filter((_, j) => j !== i))}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                        title="Remove chapter"
                                        disabled={uploading}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            {chapterRanges.length === 0 && (
                                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg bg-white">
                                    <BookOpen className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm text-slate-500">No chapters defined.</p>
                                    <p className="text-xs text-slate-400 mt-1">The entire book will be treated as a single section.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            className={`w-full flex items-center justify-center py-3 px-4 rounded-xl text-white font-medium text-base transition-all duration-200
                                ${!file
                                    ? 'bg-slate-300 cursor-not-allowed'
                                    : uploading
                                        ? 'bg-blue-500 cursor-wait'
                                        : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md active:scale-[0.99]'
                                }
                            `}
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
