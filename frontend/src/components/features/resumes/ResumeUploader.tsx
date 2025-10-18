import React, { useCallback, useState } from 'react';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import toast from 'react-hot-toast';

interface FileWithPreview {
    file: File;
    id: string;
    status: 'ready' | 'error';
    errorMessage?: string;
}

interface ResumeUploaderProps {
    onUpload: (files: File[]) => Promise<void>;
    maxFileSize?: number; // in bytes
    acceptedFormats?: string[];
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FORMATS = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export const ResumeUploader: React.FC<ResumeUploaderProps> = ({
    onUpload,
    maxFileSize = MAX_FILE_SIZE,
    acceptedFormats = ACCEPTED_FORMATS,
}) => {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const validateFile = (file: File): { valid: boolean; error?: string } => {
        if (file.size > maxFileSize) {
            return {
                valid: false,
                error: `File too large (max ${(maxFileSize / (1024 * 1024)).toFixed(0)}MB)`,
            };
        }

        if (!acceptedFormats.includes(file.type)) {
            return {
                valid: false,
                error: 'Unsupported file format',
            };
        }

        return { valid: true };
    };

    const handleFiles = useCallback(
        (newFiles: FileList | null) => {
            if (!newFiles) return;

            const fileArray = Array.from(newFiles);
            const processedFiles: FileWithPreview[] = fileArray.map((file) => {
                const validation = validateFile(file);
                return {
                    file,
                    id: Math.random().toString(36).substr(2, 9),
                    status: validation.valid ? 'ready' : 'error',
                    errorMessage: validation.error,
                };
            });

            setFiles((prev) => [...prev, ...processedFiles]);
        },
        [maxFileSize, acceptedFormats]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(e.dataTransfer.files);
        },
        [handleFiles]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            handleFiles(e.target.files);
            e.target.value = ''; // Reset input
        },
        [handleFiles]
    );

    const removeFile = (id: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const handleUpload = async () => {
        const validFiles = files.filter((f) => f.status === 'ready');

        if (validFiles.length === 0) {
            toast.error('No valid files to upload');
            return;
        }

        setIsUploading(true);

        try {
            await onUpload(validFiles.map((f) => f.file));
            setFiles([]); // Clear files after successful upload
        } catch (error) {
            console.error('Upload error:', error);
            // Error handling is done in parent component
        } finally {
            setIsUploading(false);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <Card className="mb-6">
            <div className="space-y-4">
                {/* Drop Zone */}
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragging
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }
          `}
                >
                    <div className="flex flex-col items-center">
                        <svg
                            className="w-12 h-12 text-gray-400 mb-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                        <p className="text-lg font-medium text-gray-700 mb-1">
                            Drop files here or click to browse
                        </p>
                        <p className="text-sm text-gray-500">
                            Accepted: PDF, DOC, DOCX • Max size: {(maxFileSize / (1024 * 1024)).toFixed(0)}MB
                        </p>
                        <input
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileInput}
                            className="hidden"
                            id="file-upload"
                        />
                        <label htmlFor="file-upload" className="mt-4 cursor-pointer">
                            <span className="inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 px-4 py-2 text-base rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500">
                                Select Files
                            </span>
                        </label>
                    </div>
                </div>

                {/* File List */}
                {files.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Selected Files ({files.length})</h4>
                        <div className="space-y-2">
                            {files.map((fileItem) => (
                                <div
                                    key={fileItem.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                                >
                                    <div className="flex items-center flex-1 min-w-0">
                                        <div className="flex-shrink-0 mr-3">
                                            {fileItem.status === 'ready' ? (
                                                <svg
                                                    className="w-5 h-5 text-green-600"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                            ) : (
                                                <svg
                                                    className="w-5 h-5 text-red-600"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {fileItem.file.name}
                                            </p>
                                            <p
                                                className={`text-xs ${fileItem.status === 'error' ? 'text-red-600' : 'text-gray-500'
                                                    }`}
                                            >
                                                {fileItem.status === 'error'
                                                    ? fileItem.errorMessage
                                                    : formatFileSize(fileItem.file.size)}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeFile(fileItem.id)}
                                        className="ml-4 text-gray-400 hover:text-gray-600"
                                        aria-label={`Remove ${fileItem.file.name}`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Upload Button */}
                {files.length > 0 && (
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <Button
                            variant="primary"
                            onClick={handleUpload}
                            isLoading={isUploading}
                            disabled={files.filter((f) => f.status === 'ready').length === 0}
                            fullWidth
                        >
                            Upload {files.filter((f) => f.status === 'ready').length} Resume(s)
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => setFiles([])}
                            disabled={isUploading}
                        >
                            Clear All
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    );
};

