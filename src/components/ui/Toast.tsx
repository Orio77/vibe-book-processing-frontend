import { useEffect } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { TOAST_DURATION_MS } from '@/lib/constants';
import type { ToastData } from '@/types';

interface ToastProps extends ToastData {
    readonly onClose: () => void;
}

export function Toast({ message, type, onClose }: Readonly<ToastProps>) {
    useEffect(() => {
        const timer = setTimeout(onClose, TOAST_DURATION_MS);
        return () => clearTimeout(timer);
    }, [onClose]);

    const isSuccess = type === 'success';

    return (
        <div
            role="alert"
            className={`fixed bottom-4 right-4 flex items-center p-4 rounded-lg shadow-lg border z-50 animate-in slide-in-from-bottom-5 fade-in duration-300
        ${isSuccess
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
        >
            {isSuccess ? (
                <CheckCircle2 className="w-5 h-5 mr-3 text-green-500" />
            ) : (
                <XCircle className="w-5 h-5 mr-3 text-red-500" />
            )}
            <p className="text-sm font-medium">{message}</p>
            <button
                onClick={onClose}
                className="ml-4 text-gray-400 hover:text-gray-600"
                aria-label="Dismiss"
            >
                <XCircle className="w-4 h-4" />
            </button>
        </div>
    );
}
