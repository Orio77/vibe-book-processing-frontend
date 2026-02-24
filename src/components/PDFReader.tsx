
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowLeft, BookOpen, Menu, X } from 'lucide-react';
import { PDFTools } from './PDFTools';

const API_URL = 'http://localhost:8080/api/pdf';

interface Sentence {
    id: number;
    content: string;
    sentenceIndex: number;
    pdfId: number;
    chapterId: number;
}

interface Chapter {
    id: number;
    title: string;
    startPage: number;
    endPage: number;
    pdfId: number;
}

interface PdfInfo {
    id: number;
    title: string;
    totalPages: number;
    createdAt: string;
}

const PDFReader = () => {
    const { id } = useParams<{ id: string }>();
    const [pdfInfo, setPdfInfo] = useState<PdfInfo | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [sentences, setSentences] = useState<Sentence[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [metaLoading, setMetaLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Load PDF metadata and chapters once on mount
    useEffect(() => {
        if (!id) return;
        const fetchMeta = async () => {
            setMetaLoading(true);
            try {
                const [pdfRes, chaptersRes] = await Promise.all([
                    axios.get(`${API_URL}/get/${id}`),
                    axios.get(`${API_URL}/chapter/get/all/${id}`),
                ]);
                setPdfInfo(pdfRes.data);
                setChapters(chaptersRes.status === 204 ? [] : chaptersRes.data);
            } catch (error) {
                console.error('Error fetching PDF metadata:', error);
            } finally {
                setMetaLoading(false);
            }
        };
        fetchMeta();
    }, [id]);

    // Load sentences whenever the page changes
    useEffect(() => {
        if (!id) return;
        const fetchPage = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${API_URL}/sentence/get/${id}`, {
                    params: { startPage: page, endPage: page },
                });
                setSentences(response.status === 204 ? [] : response.data);
            } catch (error) {
                console.error('Error fetching page content:', error);
                setSentences([]);
            } finally {
                setLoading(false);
            }
        };
        fetchPage();
    }, [page, id]);

    const totalPages = pdfInfo?.totalPages ?? 1;

    const handlePrev = () => setPage(p => Math.max(1, p - 1));
    const handleNext = () => setPage(p => Math.min(totalPages, p + 1));
    const jumpToChapter = (chapter: Chapter) => {
        setPage(chapter.startPage);
        setSidebarOpen(false);
    };

    const activeChapter = chapters.find(c => page >= c.startPage && page <= c.endPage);

    if (metaLoading) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-64px)]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const progressPercentage = (page / totalPages) * 100;

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50 relative">
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-200 z-30">
                <div
                    className="h-full bg-blue-600 transition-all duration-300 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                />
            </div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-20 md:hidden transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar with Chapters */}
            <div className={`
                fixed md:static inset-y-0 left-0 z-30 h-full bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out shadow-xl md:shadow-none
                ${sidebarOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full md:translate-x-0'}
            `}>
                <div className="flex flex-col h-full">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                        <h2 className="font-semibold text-slate-800 truncate pr-4" title={pdfInfo?.title}>
                            {pdfInfo?.title || 'Document'}
                        </h2>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="md:hidden p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="p-4">
                            {/* Tools Integration */}
                            {pdfInfo && (
                                <div className="mb-8">
                                    <PDFTools
                                        pdfId={pdfInfo.id}
                                        chapterId={activeChapter ? activeChapter.id : null}
                                    />
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-3 px-1">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Table of Contents
                                </h3>
                                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                    {chapters.length}
                                </span>
                            </div>

                            {chapters.length === 0 ? (
                                <div className="text-center py-8 px-4 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                                    <p className="text-sm text-slate-500">No chapters found.</p>
                                </div>
                            ) : (
                                <ul className="space-y-1">
                                    {chapters.map((chapter) => {
                                        const isActive = activeChapter?.id === chapter.id;
                                        return (
                                            <li key={chapter.id}>
                                                <button
                                                    onClick={() => jumpToChapter(chapter)}
                                                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 group flex flex-col
                                                        ${isActive
                                                            ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100/50'
                                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                                                    `}
                                                >
                                                    <span className={`text-sm font-medium line-clamp-2 ${isActive ? 'text-blue-700' : 'text-slate-700 group-hover:text-slate-900'}`}>
                                                        {chapter.title}
                                                    </span>
                                                    <span className={`text-xs mt-1 ${isActive ? 'text-blue-500' : 'text-slate-400'}`}>
                                                        Pages {chapter.startPage} - {chapter.endPage}
                                                    </span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                {/* Toolbar */}
                <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 md:hidden text-slate-500 transition-colors"
                            aria-label="Toggle sidebar"
                        >
                            <Menu size={20} />
                        </button>
                        <Link
                            to="/"
                            className="hidden sm:flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-md"
                        >
                            <ArrowLeft size={16} className="mr-1.5" /> Library
                        </Link>

                        <div className="h-4 w-px bg-slate-200 hidden sm:block mx-2"></div>

                        {activeChapter ? (
                            <span className="text-sm font-medium text-slate-700 truncate max-w-[200px] sm:max-w-xs lg:max-w-md">
                                {activeChapter.title}
                            </span>
                        ) : (
                            <span className="text-sm font-medium text-slate-400 italic">
                                Unmapped section
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200">
                            <span className="text-sm text-slate-500 px-2">
                                <input
                                    type="number"
                                    value={page}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val)) setPage(Math.min(Math.max(1, val), totalPages));
                                    }}
                                    className="w-12 text-center bg-white border border-slate-200 rounded-md py-0.5 mx-1 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                                <span className="text-slate-400">/ {totalPages}</span>
                            </span>
                        </div>
                        <div className="flex rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                            <button
                                onClick={handlePrev}
                                disabled={page <= 1}
                                className="p-2 bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600 transition-colors border-r border-slate-200"
                                aria-label="Previous page"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={page >= totalPages}
                                className="p-2 bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600 transition-colors"
                                aria-label="Next page"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Viewer */}
                <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
                    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-8 lg:py-12">
                        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl min-h-[600px] p-8 sm:p-12 lg:p-16 prose prose-slate prose-lg max-w-none">
                            {loading ? (
                                <div className="flex flex-col justify-center items-center h-64 space-y-4">
                                    <div className="animate-pulse flex space-x-4 w-full max-w-md">
                                        <div className="flex-1 space-y-4 py-1">
                                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                            <div className="space-y-2">
                                                <div className="h-4 bg-slate-200 rounded"></div>
                                                <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-sm text-slate-400 font-medium">Loading page {page}...</span>
                                </div>
                            ) : sentences.length > 0 ? (
                                <div className="space-y-6 text-slate-800 leading-relaxed font-serif">
                                    {activeChapter && page === activeChapter.startPage && (
                                        <div className="mb-10 pb-6 border-b border-slate-100">
                                            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-2">
                                                {activeChapter.title}
                                            </h1>
                                        </div>
                                    )}
                                    <div className="text-lg">
                                        {sentences.map((sentence) => (
                                            <span
                                                key={sentence.id}
                                                className="inline hover:bg-blue-50 transition-colors duration-200 rounded px-0.5 cursor-text"
                                            >
                                                {sentence.content}{' '}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                        <BookOpen size={32} className="text-slate-300" />
                                    </div>
                                    <p className="text-lg font-medium text-slate-600">Blank Page</p>
                                    <p className="text-sm mt-1">No text content found on page {page}.</p>
                                </div>
                            )}
                        </div>

                        {/* Bottom Navigation */}
                        <div className="mt-8 flex justify-between items-center text-sm text-slate-500 px-4">
                            <button
                                onClick={handlePrev}
                                disabled={page <= 1}
                                className="hover:text-blue-600 disabled:opacity-50 transition-colors flex items-center"
                            >
                                <ChevronLeft size={16} className="mr-1" /> Previous Page
                            </button>
                            <span>{page} / {totalPages}</span>
                            <button
                                onClick={handleNext}
                                disabled={page >= totalPages}
                                className="hover:text-blue-600 disabled:opacity-50 transition-colors flex items-center"
                            >
                                Next Page <ChevronRight size={16} className="ml-1" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PDFReader;
