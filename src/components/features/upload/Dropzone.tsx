import type React from 'react';
import { Upload, FileText } from 'lucide-react';

interface DropzoneProps {
    readonly file: File | null;
    readonly pageCount: number | null;
    readonly isDragging: boolean;
    readonly uploading: boolean;
    readonly onDragOver: (e: React.DragEvent) => void;
    readonly onDragLeave: (e: React.DragEvent) => void;
    readonly onDrop: (e: React.DragEvent) => void;
    readonly onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function getDropzoneClass(isDragging: boolean, file: File | null): string {
    if (isDragging) return 'border-blue-500 bg-blue-50 scale-[1.02]';
    if (file) return 'border-green-300 bg-green-50/30';
    return 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400';
}

export function Dropzone({
    file,
    pageCount,
    isDragging,
    uploading,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileChange,
}: DropzoneProps) {
    return (
        <div>
            {/* 
        The interactive <label> wraps the hidden <input> and handles keyboard/click natively.
        Drag events are added to the label for drag-and-drop support.
      */}
            <label
                htmlFor="dropzone-file"
                className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl transition-all duration-200 ease-in-out cursor-pointer
          ${getDropzoneClass(isDragging, file)}
        `}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >
                <input
                    id="dropzone-file"
                    type="file"
                    className="sr-only"
                    accept=".pdf"
                    onChange={onFileChange}
                    disabled={uploading}
                />

                <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center pointer-events-none">
                    {file ? (
                        <>
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                                <FileText className="w-6 h-6 text-green-600" />
                            </div>
                            <p className="text-sm font-semibold text-slate-700 mb-1 truncate max-w-[250px] sm:max-w-sm">
                                {file.name}
                            </p>
                            <p className="text-xs text-slate-500">
                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                                {pageCount != null && <span className="mx-1">•</span>}
                                {pageCount != null && <span>{pageCount} pages</span>}
                            </p>
                        </>
                    ) : (
                        <>
                            <Upload
                                className={`w-10 h-10 mb-3 ${isDragging ? 'text-blue-500 animate-bounce' : 'text-slate-400'}`}
                            />
                            <p className="mb-2 text-sm text-slate-600">
                                <span className="font-semibold text-blue-600">
                                    Click to upload
                                </span>{' '}
                                or drag and drop
                            </p>
                            <p className="text-xs text-slate-400">
                                PDF documents up to 50MB
                            </p>
                        </>
                    )}
                </div>
            </label>
        </div>
    );
}
