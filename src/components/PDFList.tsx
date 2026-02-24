
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import { Book, Trash2, BookOpen } from 'lucide-react';

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

    const handleDelete = async (id: number) => {
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

    if (loading) return <div className="text-center mt-10">Loading PDFs...</div>;

    return (
        <div className="container mx-auto px-4 sm:px-8">
            <div className="py-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold leading-tight">Available Books</h2>
                    <Link to="/upload" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded inline-flex items-center">
                        <Book className="w-4 h-4 mr-2" /> Add New
                    </Link>
                </div>

                {pdfs.length === 0 ? (
                    <div className="text-center p-10 bg-white rounded shadow text-gray-500">
                        No PDFs found. Upload one to get started!
                    </div>
                ) : (
                    <div className="-mx-4 sm:-mx-8 px-4 sm:px-8 py-4 overflow-x-auto">
                        <div className="inline-block min-w-full shadow rounded-lg overflow-hidden">
                            <table className="min-w-full leading-normal">
                                <thead>
                                    <tr>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Title / Filename
                                        </th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            ID
                                        </th>
                                        <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pdfs.map((pdf) => (
                                        <tr key={pdf.id}>
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                                                        <BookOpen size={20} />
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-gray-900 whitespace-no-wrap">
                                                            {pdf.title || `Book ${pdf.id}`}
                                                            {pdf.totalPages != null && <span className="ml-2 text-xs text-gray-400">({pdf.totalPages} pages)</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                                <p className="text-gray-900 whitespace-no-wrap">{pdf.id}</p>
                                            </td>
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                                                <Link to={`/read/${pdf.id}`} className="text-blue-600 hover:text-blue-900 mr-4 inline-block">
                                                    Read
                                                </Link>
                                                <button onClick={() => handleDelete(pdf.id)} className="text-red-600 hover:text-red-900 inline-block">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PDFList;
