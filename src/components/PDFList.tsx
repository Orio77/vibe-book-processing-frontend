import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import { Book, Trash2, BookOpen, FileText, Plus, Clock } from 'lucide-react';

const API_URL = 'http://localhost:8080/api/pdf';

interface PDF {
    id: number;
    title: string;
    totalPages: number;
    createdAt: string;
}

const PDFList = () => {
    const [pdfs, setPdfs] = useState<PDF[]>([]);
    const [loading, setLoading] = useState(true);

    const location = useLocation();

    const fetchPdfs = async () => {
        try {
            const response = await axios.get(`${API_URL}/get/all`);
            // 204 No Content means the library is empty
            setPdfs(response.status === 204 ? [] : response.data);
        } catch (error) {
            console.error('Error fetching PDFs:', error);
            setPdfs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPdfs();
    }, [location]);

    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation if clicking delete on a Link wrapper
        if (!window.confirm('Are you sure you want to delete this PDF?')) return;
        try {
            await axios.delete(`${API_URL}/delete/${id}`);
            setPdfs(prev => prev.filter(pdf => pdf.id !== id));
        } catch (error: any) {
            const status = error.response?.status;
            if (status === 404) {
                alert('Book not found — it may have already been deleted.');
                setPdfs(prev => prev.filter(pdf => pdf.id !== id));
            } else {
                console.error('Error deleting PDF:', error);
                alert('Failed to delete the book. Please try again.');
            }
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Your Library</h2>
                    <p className="text-slate-500 mt-1">Manage and read your uploaded books</p>
                </div>
                <Link
                    to="/upload"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-lg inline-flex items-center transition-colors shadow-sm hover:shadow"
                >
                    <Plus className="w-5 h-5 mr-2" /> Add New Book
                </Link>
            </div>

            {pdfs.length === 0 ? (
                <div className="text-center py-16 px-6 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                        <BookOpen className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Your library is empty</h3>
                    <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                        Upload your first PDF book to start reading, analyzing, and extracting insights.
                    </p>
                    <Link
                        to="/upload"
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                    >
                        Upload a PDF
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {pdfs.map((pdf) => (
                        <Link
                            to={`/read/${pdf.id}`}
                            key={pdf.id}
                            className="group flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden hover:border-blue-300"
                        >
                            {/* Book Cover Placeholder */}
                            <div className="aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 relative flex items-center justify-center p-6 border-b border-slate-100">
                                <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors duration-200" />
                                <div className="w-full h-full bg-white shadow-sm rounded border border-slate-200 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-slate-300 to-slate-400" /> {/* Spine effect */}
                                    <FileText className="w-10 h-10 text-slate-300 mb-3" />
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider line-clamp-3">
                                        {pdf.title || `Book ${pdf.id}`}
                                    </span>
                                </div>
                            </div>

                            {/* Book Details */}
                            <div className="p-4 flex-1 flex flex-col">
                                <h3 className="font-semibold text-slate-900 line-clamp-1 mb-1 group-hover:text-blue-600 transition-colors">
                                    {pdf.title || `Book ${pdf.id}`}
                                </h3>
                                <div className="flex items-center text-xs text-slate-500 mb-4 mt-auto pt-2">
                                    <span className="flex items-center">
                                        <FileText className="w-3.5 h-3.5 mr-1" />
                                        {pdf.totalPages != null ? `${pdf.totalPages} pages` : 'Unknown pages'}
                                    </span>
                                    {pdf.createdAt && (
                                        <>
                                            <span className="mx-2">•</span>
                                            <span className="flex items-center">
                                                <Clock className="w-3.5 h-3.5 mr-1" />
                                                {new Date(pdf.createdAt).toLocaleDateString()}
                                            </span>
                                        </>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                    <span className="text-sm font-medium text-blue-600 flex items-center">
                                        Read <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                                    </span>
                                    <button
                                        onClick={(e) => handleDelete(pdf.id, e)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                        title="Delete book"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PDFList;
