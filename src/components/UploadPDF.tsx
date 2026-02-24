
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';
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
    const navigate = useNavigate();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const selected = e.target.files[0];
        setFile(selected);
        setPageCount(null);
        try {
            const arrayBuffer = await selected.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            setPageCount(pdf.numPages);
        } catch {
            // Non-critical: page count stays null if pdf.js can't read it
        }
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
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md mt-10">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Upload PDF Book</h2>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            <form onSubmit={handleUpload}>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="file-upload">
                        Choose PDF File
                    </label>
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-4 text-gray-500" />
                                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-gray-500">PDF (MAX. 50MB)</p>
                            </div>
                            <input id="dropzone-file" type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
                        </label>
                    </div>
                    {file && (
                        <p className="mt-2 text-sm text-gray-600">
                            Selected: {file.name}
                            {pageCount != null && <span className="ml-2 text-gray-400">({pageCount} pages)</span>}
                        </p>
                    )}
                </div>

                {/* Optional chapter ranges */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-gray-700 text-sm font-bold">Chapter Page Ranges <span className="font-normal text-gray-400">(optional)</span></label>
                        <button type="button" onClick={() => setChapterRanges([...chapterRanges, { startPage: '', endPage: pageCount != null ? String(pageCount) : '' }])}
                            className="text-sm text-blue-500 hover:text-blue-700">+ Add Chapter</button>
                    </div>
                    {chapterRanges.map((range, i) => (
                        <div key={i} className="flex gap-2 mb-2 items-center">
                            <input type="number" min="1" placeholder="Start page"
                                value={range.startPage}
                                onChange={e => { const updated = [...chapterRanges]; updated[i].startPage = e.target.value; setChapterRanges(updated); }}
                                className="border border-gray-300 rounded px-2 py-1 text-sm w-1/3" />
                            <span className="text-gray-500">–</span>
                            <input type="number" min="1" placeholder="End page"
                                value={range.endPage}
                                onChange={e => { const updated = [...chapterRanges]; updated[i].endPage = e.target.value; setChapterRanges(updated); }}
                                className="border border-gray-300 rounded px-2 py-1 text-sm w-1/3" />
                            <button type="button" onClick={() => setChapterRanges(chapterRanges.filter((_, j) => j !== i))}
                                className="text-red-400 hover:text-red-600 text-xs">✕</button>
                        </div>
                    ))}
                    {chapterRanges.length === 0 && <p className="text-xs text-gray-400 italic">No chapters defined — a default single-chapter range will be sent.</p>}
                </div>

                <div className="flex items-center justify-center">
                    <button
                        className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        type="submit"
                        disabled={uploading}
                    >
                        {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UploadPDF;
