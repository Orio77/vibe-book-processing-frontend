
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowLeft, BookOpen } from 'lucide-react';
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
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Sidebar with Chapters */}
            <div className={`
                absolute md:static z-20 h-full bg-white border-r transition-all duration-300 ease-in-out
                ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-64 md:translate-x-0'}
            `}>
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                        <h2 className="font-bold text-gray-700 truncate" title={pdfInfo?.title}>
                            {pdfInfo?.title || 'Document'}
                        </h2>
                        <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 rounded hover:bg-gray-200">
                            <ChevronLeft size={20} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {/* Tools Integration */}
                        {pdfInfo && (
                            <PDFTools
                                pdfId={pdfInfo.id}
                                chapterId={activeChapter ? activeChapter.id : null}
                            />
                        )}

                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2 px-2">
                            Chapters
                        </h3>
                        {chapters.length === 0 ? (
                            <p className="text-sm text-gray-500 italic px-2">No chapters found.</p>
                        ) : (
                            <ul className="space-y-1">
                                {chapters.map((chapter) => (
                                    <li key={chapter.id}>
                                        <button
                                            onClick={() => jumpToChapter(chapter)}
                                            className={`w-full text-left px-3 py-2 text-sm rounded transition-colors
                                                ${activeChapter?.id === chapter.id
                                                    ? 'bg-blue-100 text-blue-800 font-medium'
                                                    : 'text-gray-600 hover:bg-gray-100'}
                                            `}
                                        >
                                            {chapter.title}
                                            <span className="block text-xs text-gray-400 font-normal">
                                                Page {chapter.startPage} - {chapter.endPage}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-gray-100">
                {/* Toolbar */}
                <div className="bg-white border-b px-4 py-2 flex items-center justify-between shadow-sm">
                    <div className="flex items-center">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="mr-3 p-2 rounded-full hover:bg-gray-100 md:hidden text-gray-600"
                        >
                            <BookOpen size={20} />
                        </button>
                        <Link to="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mr-4">
                            <ArrowLeft size={16} className="mr-1" /> Back
                        </Link>
                        {activeChapter && (
                            <span className="text-sm font-medium text-gray-800 hidden sm:inline-block">
                                Current: {activeChapter.title}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">
                            Page <input
                                type="number"
                                value={page}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val)) setPage(Math.min(Math.max(1, val), totalPages));
                                }}
                                className="w-12 text-center border rounded mx-1"
                            /> of {totalPages}
                        </span>
                        <div className="flex rounded-md shadow-sm">
                            <button
                                onClick={handlePrev}
                                disabled={page <= 1}
                                className="p-2 border rounded-l-md bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={page >= totalPages}
                                className="p-2 border-l-0 border rounded-r-md bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Viewer */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                    <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg min-h-[500px] p-8 sm:p-12">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <span className="text-gray-400">Loading content...</span>
                            </div>
                        ) : sentences.length > 0 ? (
                            <div className="space-y-4 text-gray-800 leading-relaxed">
                                {activeChapter && (
                                    <div className="mb-6 pb-2 border-b">
                                        <h2 className="text-2xl font-bold text-gray-900">{activeChapter.title}</h2>
                                    </div>
                                )}
                                {sentences.map((sentence) => (
                                    <p key={sentence.id} className="text-justify hover:bg-yellow-50 transition-colors p-1 rounded">
                                        {sentence.content}
                                    </p>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <BookOpen size={48} className="mb-4 opacity-20" />
                                <p>No content available for this page.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PDFReader;
