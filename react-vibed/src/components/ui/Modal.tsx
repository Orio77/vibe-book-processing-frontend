import type React from 'react';
import { X } from 'lucide-react';
import { useState } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    const [mounted, setMounted] = useState(isOpen);

    if (isOpen && !mounted) {
        setMounted(true);
    }

    console.log(mounted, title);
    

    if (!mounted) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm ${isOpen ? 'animate-in fade-in' : 'animate-out fade-out'} duration-200`}
         onClick={onClose}
         
         onAnimationEnd={() => { if (!isOpen) setMounted(false); }}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {children}
                </div>
            </div>
        </div>
    );
};
