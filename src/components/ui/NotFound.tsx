import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

export function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <FileQuestion className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">
                Page Not Found
            </h2>
            <p className="text-slate-500 mb-6 max-w-md">
                The page you're looking for doesn't exist or has been moved.
            </p>
            <Link
                to={ROUTES.HOME}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
                Back to Library
            </Link>
        </div>
    );
}
