import { useState, useRef } from 'react';
import clsx from 'clsx';

type Props = {
    multiple?: boolean;
    accept?: string;
    maxSize?: number; 
    onFiles: (files: FileList) => void;
    onError?: (error: string) => void;
    disabled?: boolean;
    className?: string;
};

export default function FileUpload({
    multiple,
    accept = '.pdf,.doc,.docx',
    maxSize = 10,
    onFiles,
    onError,
    disabled = false,
    className
}: Props) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFiles = (files: FileList | null) => {
        if (!files) return;

        const fileArray = Array.from(files);
        const errors: string[] = [];

        
        fileArray.forEach(file => {
            if (maxSize && file.size > maxSize * 1024 * 1024) {
                errors.push(`${file.name} is too large (max ${maxSize}MB)`);
            }
        });

        if (errors.length > 0) {
            onError?.(errors.join(', '));
            return;
        }

        setSelectedFiles(fileArray);
        onFiles(files);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (disabled) return;
        handleFiles(e.dataTransfer.files);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const removeFile = (index: number) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(newFiles);

        
        const dt = new DataTransfer();
        newFiles.forEach(file => dt.items.add(file));
        onFiles(dt.files);
    };

    return (
        <div className={clsx('space-y-4', className)}>
            <div
                className={clsx(
                    'relative border-2 border-dashed rounded-lg p-6 transition-colors',
                    isDragOver && !disabled
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-300 hover:border-gray-400',
                    disabled && 'opacity-50 cursor-not-allowed'
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                <div className="text-center">
                    <svg
                        className={clsx(
                            'mx-auto h-12 w-12 mb-4',
                            isDragOver ? 'text-primary-500' : 'text-gray-400'
                        )}
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                    >
                        <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                        <label
                            htmlFor="file-upload"
                            className={clsx(
                                'relative cursor-pointer rounded-md font-medium focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500',
                                disabled ? 'text-gray-400' : 'text-primary-600 hover:text-primary-500'
                            )}
                        >
                            <span>Upload files</span>
                            <input
                                ref={fileInputRef}
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                className="sr-only"
                                multiple={multiple}
                                accept={accept}
                                onChange={(e) => handleFiles(e.target.files)}
                                disabled={disabled}
                            />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        {accept.split(',').join(', ')} up to {maxSize}MB each
                    </p>
                </div>
            </div>

            {selectedFiles.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Selected files:</h4>
                    {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                    <svg className="h-8 w-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}


