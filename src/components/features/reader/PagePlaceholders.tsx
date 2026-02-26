import { BookOpen } from 'lucide-react';

export function PageSkeleton({ page }: { readonly page: number }) {
    return (
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <div className="animate-pulse flex space-x-4 w-full max-w-md">
                <div className="flex-1 space-y-4 py-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded" />
                        <div className="h-4 bg-slate-200 rounded w-5/6" />
                    </div>
                </div>
            </div>
            <span className="text-sm text-slate-400 font-medium">
                Loading page {page}...
            </span>
        </div>
    );
}

export function BlankPage({ page }: { readonly page: number }) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <BookOpen size={32} className="text-slate-300" />
            </div>
            <p className="text-lg font-medium text-slate-600">Blank Page</p>
            <p className="text-sm mt-1">No text content found on page {page}.</p>
        </div>
    );
}
