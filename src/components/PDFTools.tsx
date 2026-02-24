import React, { useState, useEffect } from 'react';
import { Sparkles, BookOpen, Lightbulb, Target, Layers, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface PDFToolsProps {
    pdfId: number;
    chapterId: number | null;
}

const API_URL = 'http://localhost:8080/api/pdf/process';

// Toast Notification Component
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed bottom-4 right-4 flex items-center p-4 rounded-lg shadow-lg border z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 ${type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
            }`}>
            {type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-3 text-green-500" /> : <XCircle className="w-5 h-5 mr-3 text-red-500" />}
            <p className="text-sm font-medium">{message}</p>
            <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-600">
                <XCircle className="w-4 h-4" />
            </button>
        </div>
    );
};

export const PDFTools: React.FC<PDFToolsProps> = ({ pdfId, chapterId }) => {
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [bookContext, setBookContext] = useState(false);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };

    const handleChapterSummary = async () => {
        if (!chapterId) return;
        setLoadingAction('chapter-summary');
        try {
            // Mock API call
            console.log(`POST ${API_URL}/chapter/summary?pdfId=${pdfId}&chapterId=${chapterId}&bookContext=${bookContext}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            showToast(`Chapter summary created! (${bookContext ? 'With Book Context' : 'Chapter only'})`, 'success');
        } catch (error) {
            console.error(error);
            showToast('Error creating chapter summary.', 'error');
        } finally {
            setLoadingAction(null);
        }
    };

    const handleBookSummary = async () => {
        setLoadingAction('book-summary');
        try {
            // Mock API call
            console.log(`POST ${API_URL}/book/summary?pdfId=${pdfId}`);
            await new Promise(resolve => setTimeout(resolve, 1500));
            showToast('Book summary created successfully!', 'success');
        } catch (error) {
            console.error(error);
            showToast('Error creating book summary.', 'error');
        } finally {
            setLoadingAction(null);
        }
    };

    const handleMarkIdeas = async () => {
        if (!chapterId) return;
        setLoadingAction('mark-ideas');
        try {
            // Mock API call
            console.log(`POST ${API_URL}/chapter/ideas?pdfId=${pdfId}&chapterId=${chapterId}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            showToast('Key ideas have been marked!', 'success');
        } catch (error) {
            console.error(error);
            showToast('Error marking ideas.', 'error');
        } finally {
            setLoadingAction(null);
        }
    };

    const handleMarkExamples = async () => {
        if (!chapterId) return;
        setLoadingAction('mark-examples');
        try {
            // Mock API call
            console.log(`POST ${API_URL}/chapter/examples?pdfId=${pdfId}&chapterId=${chapterId}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            showToast('Examples have been marked!', 'success');
        } catch (error) {
            console.error(error);
            showToast('Error marking examples.', 'error');
        } finally {
            setLoadingAction(null);
        }
    };

    const handleProcessContext = async () => {
        if (!chapterId) return;
        setLoadingAction('process-context');
        try {
            // Mock API call
            console.log(`POST ${API_URL}/chapter/context?pdfId=${pdfId}&chapterId=${chapterId}&bookContext=${bookContext}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            showToast(`Context processing complete!`, 'success');
        } catch (error) {
            console.error(error);
            showToast('Error processing context.', 'error');
        } finally {
            setLoadingAction(null);
        }
    };

    const ToolButton = ({
        id,
        icon: Icon,
        label,
        onClick,
        disabled,
        colorClass,
        bgClass,
        hoverClass
    }: any) => {
        const isLoading = loadingAction === id;
        const isDisabled = disabled || loadingAction !== null;

        return (
            <button
                onClick={onClick}
                disabled={isDisabled}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 group
                    ${isDisabled
                        ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed'
                        : `bg-white border-slate-200 text-slate-700 hover:border-${colorClass}-300 hover:shadow-sm ${hoverClass}`
                    }
                `}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isDisabled ? 'bg-slate-100 text-slate-400' : bgClass} transition-colors`}>
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Icon className="w-4 h-4" />
                        )}
                    </div>
                    <span className="text-sm font-medium">{label}</span>
                </div>
                {!isDisabled && !isLoading && (
                    <span className={`text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity text-${colorClass}-600`}>
                        Run →
                    </span>
                )}
            </button>
        );
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">AI Tools</h3>
            </div>

            <div className="p-4 space-y-4">
                {/* Context Toggle */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-sm font-medium text-slate-700">Include Book Context</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={bookContext}
                            onChange={(e) => setBookContext(e.target.checked)}
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <div className="space-y-2">
                    <ToolButton
                        id="chapter-summary"
                        icon={BookOpen}
                        label="Chapter Summary"
                        onClick={handleChapterSummary}
                        disabled={!chapterId}
                        colorClass="blue"
                        bgClass="bg-blue-50 text-blue-600 group-hover:bg-blue-100"
                        hoverClass="hover:bg-blue-50/30"
                    />

                    <ToolButton
                        id="book-summary"
                        icon={Layers}
                        label="Book Summary"
                        onClick={handleBookSummary}
                        disabled={false}
                        colorClass="purple"
                        bgClass="bg-purple-50 text-purple-600 group-hover:bg-purple-100"
                        hoverClass="hover:bg-purple-50/30"
                    />

                    <ToolButton
                        id="mark-ideas"
                        icon={Lightbulb}
                        label="Extract Key Ideas"
                        onClick={handleMarkIdeas}
                        disabled={!chapterId}
                        colorClass="amber"
                        bgClass="bg-amber-50 text-amber-600 group-hover:bg-amber-100"
                        hoverClass="hover:bg-amber-50/30"
                    />

                    <ToolButton
                        id="mark-examples"
                        icon={Target}
                        label="Find Examples"
                        onClick={handleMarkExamples}
                        disabled={!chapterId}
                        colorClass="emerald"
                        bgClass="bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100"
                        hoverClass="hover:bg-emerald-50/30"
                    />
                </div>

                {!chapterId && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-700 leading-relaxed">
                            Select a chapter from the table of contents to enable chapter-specific tools.
                        </p>
                    </div>
                )}
            </div>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};
