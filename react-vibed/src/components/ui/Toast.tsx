import { useEffect } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { TOAST_DURATION_MS } from '@/lib/constants';
import type { ToastData } from '@/types';

interface ToastProps extends ToastData {
    readonly onClose: () => void;
    readonly variant?: 'default' | 'minimal';
}

export function Toast({ message, type, onClose, variant = 'default' }: Readonly<ToastProps>) {
    useEffect(() => {
        const timer = setTimeout(onClose, TOAST_DURATION_MS);
        return () => clearTimeout(timer);
    }, [onClose]);

    const isSuccess = type === 'success';
    const isMinimal = variant === 'minimal';

    const baseClassName = isMinimal
        ? 'fixed top-4 right-4 flex items-center px-3 py-2 rounded-md shadow-md border z-50 animate-in slide-in-from-top-3 fade-in duration-250'
        : 'fixed bottom-4 right-4 flex items-center p-4 rounded-lg shadow-lg border z-50 animate-in slide-in-from-bottom-5 fade-in duration-300';

    let stateClassName = 'bg-red-50 border-red-200 text-red-800';
    if (isSuccess && isMinimal) {
        stateClassName = 'bg-emerald-50/95 border-emerald-200 text-emerald-800';
    } else if (isSuccess) {
        stateClassName = 'bg-green-50 border-green-200 text-green-800';
    } else if (isMinimal) {
        stateClassName = 'bg-rose-50/95 border-rose-200 text-rose-800';
    }

    return (
        <div
            role="alert"
            className={`${baseClassName} ${stateClassName}`}
        >
            {isSuccess ? (
                <CheckCircle2 className={`${isMinimal ? 'w-4 h-4 mr-2.5' : 'w-5 h-5 mr-3'} text-green-500`} />
            ) : (
                <XCircle className={`${isMinimal ? 'w-4 h-4 mr-2.5' : 'w-5 h-5 mr-3'} text-red-500`} />
            )}
            <p className={`${isMinimal ? 'text-xs font-medium' : 'text-sm font-medium'}`}>{message}</p>
            <button
                onClick={onClose}
                className={`${isMinimal ? 'ml-2.5' : 'ml-4'} text-gray-400 hover:text-gray-600`}
                aria-label="Dismiss"
            >
                <XCircle className={isMinimal ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
            </button>
        </div>
    );
}
