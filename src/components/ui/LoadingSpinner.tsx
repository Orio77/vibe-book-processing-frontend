import type { ReactNode } from 'react';

interface LoadingSpinnerProps {
    /** Container height class, e.g. "h-64" */
    readonly className?: string;
    readonly size?: 'sm' | 'md' | 'lg';
    readonly label?: ReactNode;
}const sizeMap = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
} as const;

export function LoadingSpinner({
    className = 'h-64',
    size = 'md',
    label,
}: LoadingSpinnerProps) {
    return (
        <div className={`flex flex-col justify-center items-center ${className}`}>
            <div
                className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeMap[size]}`}
            />
            {label && (
                <span className="mt-3 text-sm text-slate-400 font-medium">{label}</span>
            )}
        </div>
    );
}
