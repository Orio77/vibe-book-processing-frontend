import { Plus, X, BookOpen } from 'lucide-react';
import type { ChapterRangeInput } from '@/types';

interface ChapterRangeEditorProps {
    readonly ranges: ChapterRangeInput[];
    readonly uploading: boolean;
    readonly onAdd: () => void;
    readonly onUpdate: (index: number, field: keyof ChapterRangeInput, value: string) => void;
    readonly onRemove: (index: number) => void;
}

export function ChapterRangeEditor({
    ranges,
    uploading,
    onAdd,
    onUpdate,
    onRemove,
}: ChapterRangeEditorProps) {
    return (
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <span className="block text-slate-800 text-sm font-semibold">
                        Chapter Mapping
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Define page ranges for better navigation (optional)
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onAdd}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
                    disabled={uploading}
                >
                    <Plus className="w-4 h-4" /> Add Chapter
                </button>
            </div>

            <div className="space-y-3">
                {ranges.map((range) => (
                    <div
                        key={`${range.startPage}-${range.endPage}`}
                        className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm animate-in fade-in slide-in-from-left-2"
                    >
                        <div className="flex-1 flex items-center gap-2">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                                    From
                                </span>
                                <input
                                    type="number"
                                    min="1"
                                    value={range.startPage}
                                    onChange={(e) => {
                                        const idx = ranges.indexOf(range);
                                        onUpdate(idx, 'startPage', e.target.value);
                                    }}
                                    className="w-full pl-12 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    disabled={uploading}
                                />
                            </div>
                            <span className="text-slate-300 font-medium px-1">→</span>
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                                    To
                                </span>
                                <input
                                    type="number"
                                    min="1"
                                    value={range.endPage}
                                    onChange={(e) => {
                                        const idx = ranges.indexOf(range);
                                        onUpdate(idx, 'endPage', e.target.value);
                                    }}
                                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    disabled={uploading}
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                const idx = ranges.indexOf(range);
                                onRemove(idx);
                            }}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            title="Remove chapter"
                            disabled={uploading}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}

                {ranges.length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg bg-white">
                        <BookOpen className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No chapters defined.</p>
                        <p className="text-xs text-slate-400 mt-1">
                            The entire book will be treated as a single section.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
