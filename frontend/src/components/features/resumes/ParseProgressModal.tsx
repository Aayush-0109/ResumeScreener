import React from 'react';
import { Modal, ModalFooter } from '../../common/Modal';
import { Button } from '../../common/Button';
import { ProgressBar } from '../../common/ProgressBar';
import { usePolling } from '../../../hooks/usePolling';
import ResumeService from '../../../services/resumeService';
import toast from 'react-hot-toast';

interface ParseProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    queueId: string | null;
    onComplete?: () => void;
}

export const ParseProgressModal: React.FC<ParseProgressModalProps> = ({
    isOpen,
    onClose,
    queueId,
    onComplete,
}) => {
    const { data: parseStatus, isPolling, error } = usePolling(
        async () => {
            if (!queueId) throw new Error('No queue ID');
            const response = await ResumeService.getParseStatus(queueId);
            return response?.data || null;
        },
        (status) => {
            if (!status) return false;
            return ['COMPLETED', 'FAILED', 'CANCELLED'].includes(status.status);
        },
        {
            interval: 5000, 
            enabled: isOpen && !!queueId,
            onSuccess: (data) => {
                if (data?.status === 'COMPLETED') {
                    toast.success(`Successfully parsed ${data.totalCount} resume(s)!`, { id: `parse-complete-${queueId}` });
                    onComplete?.();
                    setTimeout(() => onClose(), 2000);
                } else if (data?.status === 'FAILED') {
                    toast.error('Resume parsing failed', { id: `parse-failed-${queueId}` });
                }
            },
            onError: (err) => {
                console.error('Polling error:', err);
                
                toast.error('Failed to check parsing status', { id: `parse-error-${queueId}` });
            },
        }
    );

    const progress = parseStatus
        ? Math.round((parseStatus.processedCount / parseStatus.totalCount) * 100)
        : 0;

    const getStatusIcon = () => {
        if (!parseStatus) return null;

        switch (parseStatus.status) {
            case 'PENDING':
                return (
                    <svg
                        className="animate-spin h-8 w-8 text-[#111a2b]"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                );
            case 'PROCESSING':
                return (
                    <svg
                        className="animate-spin h-8 w-8 text-[#111a2b]"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                );
            case 'COMPLETED':
                return (
                    <svg
                        className="h-8 w-8 text-green-600"
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
                );
            case 'FAILED':
                return (
                    <svg
                        className="h-8 w-8 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                );
            default:
                return null;
        }
    };

    const getStatusMessage = () => {
        if (!parseStatus) return 'Initializing...';

        switch (parseStatus.status) {
            case 'PENDING':
                return 'Waiting in queue...';
            case 'PROCESSING':
                return `Parsing resumes... (${parseStatus.processedCount}/${parseStatus.totalCount})`;
            case 'COMPLETED':
                return 'All resumes parsed successfully!';
            case 'FAILED':
                return parseStatus.errorMessage || 'Parsing failed';
            default:
                return 'Unknown status';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Parsing Resumes"
            size="md"
            closeOnOverlayClick={!isPolling}
            closeOnEscape={!isPolling}
        >
            <div className="py-4">
                <div className="flex flex-col items-center justify-center mb-6">
                    {getStatusIcon()}
                    <p className="mt-4 text-lg font-medium text-gray-900">
                        {getStatusMessage()}
                    </p>
                </div>

                {parseStatus && parseStatus.status !== 'PENDING' && (
                    <div className="mb-4">
                        <ProgressBar
                            value={parseStatus.processedCount}
                            max={parseStatus.totalCount}
                            showLabel
                            label={`${progress}%`}
                            variant={
                                parseStatus.status === 'COMPLETED'
                                    ? 'success'
                                    : parseStatus.status === 'FAILED'
                                        ? 'danger'
                                        : 'default'
                            }
                        />
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-4 bg-red-50 rounded-md">
                        <p className="text-sm text-red-800">
                            Error: {error.message}
                        </p>
                    </div>
                )}

                {parseStatus?.errorMessage && (
                    <div className="mt-4 p-4 bg-red-50 rounded-md">
                        <p className="text-sm text-red-800">
                            {parseStatus.errorMessage}
                        </p>
                    </div>
                )}
            </div>

            <ModalFooter>
                <Button
                    variant="secondary"
                    onClick={onClose}
                    disabled={isPolling}
                >
                    {isPolling ? 'Processing...' : 'Close'}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

