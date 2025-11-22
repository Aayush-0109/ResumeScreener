import React from 'react';
import { Modal, ModalFooter } from '../../common/Modal';
import { Button } from '../../common/Button';
import { IndeterminateProgressBar } from '../../common/ProgressBar';
import { usePolling } from '../../../hooks/usePolling';
import MatchingService from '../../../services/matchingService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface MatchProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    queueId: string | null;
    jobId: string;
    onCancel?: () => void;
}

export const MatchProgressModal: React.FC<MatchProgressModalProps> = ({
    isOpen,
    onClose,
    queueId,
    jobId,
    onCancel,
}) => {
    const navigate = useNavigate();

    
    console.log('🔍 MatchProgressModal rendered - isOpen:', isOpen, 'queueId:', queueId);

    const { data: matchStatus, isPolling, stopPolling, resetPolling } = usePolling(
        async () => {
            if (!queueId) {
                console.warn('⚠️ No queue ID provided to polling');
                throw new Error('No queue ID');
            }
            console.log('📡 Polling match status for queueId:', queueId);
            const response = await MatchingService.getMatchStatus(queueId);
            console.log('📊 Match status response:', response?.data);
            return response?.data || null;
        },
        (status) => {
            if (!status) return false;
            const shouldStop = ['COMPLETED', 'FAILED', 'CANCELLED'].includes(status.status);
            console.log('🤔 Should stop polling?', shouldStop, 'Status:', status.status);
            return shouldStop;
        },
        {
            interval: 5000, 
            enabled: isOpen && !!queueId,
            onSuccess: (data) => {
                console.log('🎉 onSuccess called with status:', data?.status);

                
                stopPolling();

                if (data?.status === 'COMPLETED') {
                    toast.success('Matching completed successfully!', { id: `match-complete-${queueId}` });

                    
                    setTimeout(() => {
                        onClose();
                        navigate(`/results/${jobId}`);
                    }, 500);
                } else if (data?.status === 'FAILED') {
                    toast.error(data.errorMessage || 'Matching failed', { id: `match-failed-${queueId}` });
                } else if (data?.status === 'CANCELLED') {
                    toast('Matching was cancelled', { id: `match-cancelled-${queueId}` });
                }
            },
            onError: (err) => {
                console.error('Polling error:', err);
                
                toast.error('Failed to check matching status', { id: `match-poll-error-${queueId}` });
            },
        }
    );

    
    React.useEffect(() => {
        if (!isOpen) {
            console.log('🧹 Modal closed - stopping polling');
            stopPolling();
            resetPolling();
        }
    }, [isOpen, stopPolling, resetPolling]);

    const handleCancel = async () => {
        if (!queueId) return;

        try {
            await MatchingService.cancelMatch(queueId);
            toast.success('Match job cancelled', { id: `match-cancel-${queueId}` });
            stopPolling();
            onCancel?.();
            onClose();
        } catch (error) {
            toast.error('Failed to cancel match job', { id: `match-cancel-error-${queueId}` });
        }
    };

    const getStatusIcon = () => {
        if (!matchStatus) return null;

        switch (matchStatus.status) {
            case 'PENDING':
                return (
                    <svg
                        className="animate-spin h-8 w-8 text-blue-600"
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
                        className="animate-spin h-8 w-8 text-blue-600"
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
            case 'CANCELLED':
                return (
                    <svg
                        className="h-8 w-8 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                        />
                    </svg>
                );
            default:
                return null;
        }
    };

    const getStatusMessage = () => {
        if (!matchStatus) return 'Initializing...';

        switch (matchStatus.status) {
            case 'PENDING':
                return 'Waiting in queue...';
            case 'PROCESSING':
                return 'AI is analyzing resumes against job requirements...';
            case 'COMPLETED':
                return 'Matching complete! Redirecting to results...';
            case 'FAILED':
                return matchStatus.errorMessage || 'Matching failed';
            case 'CANCELLED':
                return 'Match job was cancelled';
            default:
                return 'Unknown status';
        }
    };

    const canCancel = matchStatus?.status === 'PENDING' || matchStatus?.status === 'PROCESSING';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Matching Resumes"
            size="md"
            closeOnOverlayClick={!isPolling}
            closeOnEscape={!isPolling}
        >
            <div className="py-4">
                <div className="flex flex-col items-center justify-center mb-6">
                    {getStatusIcon()}
                    <p className="mt-4 text-lg font-medium text-gray-900 text-center px-4">
                        {getStatusMessage()}
                    </p>
                </div>

                {matchStatus && (matchStatus.status === 'PENDING' || matchStatus.status === 'PROCESSING') && (
                    <div className="mb-4">
                        <IndeterminateProgressBar variant="default" />
                        <p className="mt-2 text-sm text-gray-600 text-center">
                            This may take 1-2 minutes depending on the number of resumes...
                        </p>
                    </div>
                )}

                {matchStatus?.errorMessage && (
                    <div className="mt-4 p-4 bg-red-50 rounded-md">
                        <p className="text-sm text-red-800">
                            {matchStatus.errorMessage}
                        </p>
                    </div>
                )}
            </div>

            <ModalFooter>
                {canCancel ? (
                    <>
                        <Button variant="secondary" onClick={onClose}>
                            Hide
                        </Button>
                        <Button variant="danger" onClick={handleCancel}>
                            Cancel Match
                        </Button>
                    </>
                ) : (
                    <Button
                        variant={matchStatus?.status === 'COMPLETED' ? 'primary' : 'secondary'}
                        onClick={() => {
                            if (matchStatus?.status === 'COMPLETED') {
                                navigate(`/results/${jobId}`);
                            } else {
                                onClose();
                            }
                        }}
                    >
                        {matchStatus?.status === 'COMPLETED' ? 'View Results' : 'Close'}
                    </Button>
                )}
            </ModalFooter>
        </Modal>
    );
};

