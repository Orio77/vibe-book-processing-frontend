import { useState, useCallback } from 'react';
import type { ToastData } from '@/types';

export function useToast() {
    const [toast, setToast] = useState<ToastData | null>(null);

    const showToast = useCallback((message: string, type: ToastData['type']) => {
        setToast({ message, type });
    }, []);

    const dismissToast = useCallback(() => setToast(null), []);

    return { toast, showToast, dismissToast } as const;
}
