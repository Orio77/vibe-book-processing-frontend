import type { ReactNode } from 'react';

interface EmptyStateProps {
    readonly icon: ReactNode;
    readonly title: string;
    readonly description?: string;
    readonly action?: ReactNode;
}export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="text-center py-16 px-6 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">{title}</h3>
            {description && (
                <p className="text-slate-500 mb-6 max-w-sm mx-auto">{description}</p>
            )}
            {action}
        </div>
    );
}
