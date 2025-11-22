import React, { useCallback, useState } from 'react';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Upload, FileText, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import toast from 'react-hot-toast';

interface FileWithPreview {
    file: File;
    id: string;
    status: 'ready' | 'error';
    errorMessage?: string;
}

interface ResumeUploaderProps {
    onUpload: (files: File[]) => Promise<void>;
    maxFileSize?: number; 
    acceptedFormats?: string[];
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; 
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
            e.target.value = ''; 
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
            setFiles([]); 
        } catch (error) {
            console.error('Upload error:', error);
            
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
        <div className="space-y-4">
            {}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                    "border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 cursor-pointer",
                    isDragging
                        ? "border-primary bg-primary/5 scale-[1.01]"
                        : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
                )}
            >
                <div className="flex flex-col items-center">
                    <div className={cn(
                        "p-4 rounded-full mb-4 transition-colors",
                        isDragging ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"
                    )}>
                        <Upload className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Drop resumes here
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                        Drag & drop PDF, DOC, or DOCX files here, or click to browse your computer
                    </p>

                    <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileInput}
                        className="hidden"
                        id="file-upload"
                    />
                    <label htmlFor="file-upload">
                        <Button variant="outline" className="pointer-events-none" asChild>
                            <span>Select Files</span>
                        </Button>
                    </label>
                    <p className="text-xs text-muted-foreground mt-4">
                        Max file size: {(maxFileSize / (1024 * 1024)).toFixed(0)}MB
                    </p>
                </div>
            </div>

            {}
            {files.length > 0 && (
                <Card className="overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                        <h4 className="font-medium text-sm text-gray-900">Selected Files ({files.length})</h4>
                        <Button variant="ghost" size="sm" onClick={() => setFiles([])} className="h-8 text-xs">
                            Clear All
                        </Button>
                    </div>
                    <div className="divide-y max-h-[300px] overflow-y-auto">
                        {files.map((fileItem) => (
                            <div
                                key={fileItem.id}
                                className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center flex-1 min-w-0 gap-3">
                                    <div className={cn(
                                        "p-2 rounded-lg",
                                        fileItem.status === 'ready' ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"
                                    )}>
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {fileItem.file.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-muted-foreground">
                                                {formatFileSize(fileItem.file.size)}
                                            </span>
                                            {fileItem.status === 'error' && (
                                                <span className="text-xs text-red-600 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    {fileItem.errorMessage}
                                                </span>
                                            )}
                                            {fileItem.status === 'ready' && (
                                                <span className="text-xs text-green-600 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Ready
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(fileItem.id)}
                                    className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t bg-gray-50">
                        <Button
                            className="w-full"
                            onClick={handleUpload}
                            isLoading={isUploading}
                            disabled={files.filter((f) => f.status === 'ready').length === 0}
                        >
                            Upload {files.filter((f) => f.status === 'ready').length} Resume(s)
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
};
