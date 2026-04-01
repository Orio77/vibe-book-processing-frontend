import { Clock3, Loader2, MessageSquareText, Sparkles, ScrollText, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ReaderRequest } from '@/hooks/useReaderRequests';

interface RequestQueuePanelProps {
    readonly requests: ReaderRequest[];
    readonly onSelectRequest: (requestId: string) => void;
}

function getStatusBadgeClass(status: ReaderRequest['status']): string {
    if (status === 'pending') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (status === 'success') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
}

function getStatusLabel(status: ReaderRequest['status']): string {
    if (status === 'pending') return 'Pending';
    if (status === 'success') return 'Done';
    return 'Failed';
}

function RequestTypeIcon({ type }: { readonly type: ReaderRequest['type'] }) {
    if (type === 'query') {
        return <MessageSquareText className="w-4 h-4 text-teal-600" />;
    }

    if (type === 'summary') {
        return <ScrollText className="w-4 h-4 text-violet-600" />;
    }

    if (type === 'idea-extract') {
        return <Sparkles className="w-4 h-4 text-amber-600" />;
    }

    if (type === 'idea-explain') {
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
    }

    if (type === 'ideas-explain') {
        return <Sparkles className="w-4 h-4 text-fuchsia-600" />;
    }

    return <Sparkles className="w-4 h-4 text-blue-600" />;
}

function getRequestTitle(request: ReaderRequest): string {
    if (request.type === 'query') return request.query ?? 'Chat request';
    if (request.type === 'summary') return 'Chapter summary request';
    if (request.type === 'idea-extract') return request.query ?? 'Idea extraction request';
    if (request.type === 'idea-explain') return request.query ?? 'Idea explanation request';
    if (request.type === 'ideas-explain') return request.query ?? 'Ideas explanation request';
    return 'Explanation request';
}

function StatusIcon({ status }: { readonly status: ReaderRequest['status'] }) {
    if (status === 'pending') {
        return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
    }

    if (status === 'success') {
        return <CheckCircle2 className="w-3.5 h-3.5" />;
    }

    return <AlertCircle className="w-3.5 h-3.5" />;
}

function formatTimestamp(timestamp: Date): string {
    return new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).format(timestamp);
}

export function RequestQueuePanel({ requests, onSelectRequest }: RequestQueuePanelProps) {
    const orderedRequests = [...requests].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (orderedRequests.length === 0) {
        return (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                No requests yet. Select sentences and send an explanation or query.
            </div>
        );
    }

    return (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
            {orderedRequests.map((request) => (
                <button
                    key={request.id}
                    type="button"
                    onClick={() => onSelectRequest(request.id)}
                    className="w-full text-left rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors p-4"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                            <RequestTypeIcon type={request.type} />
                            <p className="text-sm font-semibold text-slate-800 truncate">
                                {getRequestTitle(request)}
                            </p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${getStatusBadgeClass(request.status)}`}>
                            <StatusIcon status={request.status} />
                            {getStatusLabel(request.status)}
                        </span>
                    </div>

                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                            <Clock3 className="w-3.5 h-3.5" />
                            {formatTimestamp(request.timestamp)}
                        </span>
                        <span>{request.sentences.length} context sentence{request.sentences.length === 1 ? '' : 's'}</span>
                    </div>
                </button>
            ))}
        </div>
    );
}
