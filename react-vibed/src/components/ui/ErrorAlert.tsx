import { AlertCircle } from 'lucide-react';

interface ErrorAlertProps {
    readonly message: string;
}export function ErrorAlert({ message }: ErrorAlertProps) {
    return (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3 mb-6 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span className="block sm:inline text-sm font-medium">{message}</span>
        </div>
    );
}
