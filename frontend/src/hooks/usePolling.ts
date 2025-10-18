import { useEffect, useRef, useState } from 'react';

export interface PollingOptions<T> {
    interval: number; // Polling interval in milliseconds
    maxAttempts?: number; // Maximum number of polling attempts
    enabled?: boolean; // Enable/disable polling
    onSuccess?: (data: T) => void; // Callback on successful completion
    onError?: (error: Error) => void; // Callback on error
    onMaxAttemptsReached?: () => void; // Callback when max attempts reached
}

export interface PollingResult<T> {
    data: T | null;
    error: Error | null;
    isPolling: boolean;
    attemptCount: number;
    stopPolling: () => void;
    startPolling: () => void;
    resetPolling: () => void;
}

/**
 * Generic polling hook for async operations
 * 
 * @param queryFn - Function that fetches data
 * @param shouldStopPolling - Function that determines if polling should stop
 * @param options - Polling configuration options
 * 
 * @example
 * const { data, isPolling } = usePolling(
 *   () => fetchStatus(queueId),
 *   (status) => ['COMPLETED', 'FAILED'].includes(status.status),
 *   {
 *     interval: 2000,
 *     enabled: !!queueId,
 *     onSuccess: (data) => console.log('Done!', data)
 *   }
 * );
 */
export function usePolling<T>(
    queryFn: () => Promise<T>,
    shouldStopPolling: (data: T) => boolean,
    options: PollingOptions<T>
): PollingResult<T> {
    const {
        interval,
        maxAttempts,
        enabled = true,
        onSuccess,
        onError,
        onMaxAttemptsReached,
    } = options;

    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [attemptCount, setAttemptCount] = useState(0);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = useRef(true);

    const clearExistingTimeout = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    const stopPolling = () => {
        setIsPolling(false);
        clearExistingTimeout();
    };

    const startPolling = () => {
        if (enabled) {
            setIsPolling(true);
            setError(null);
            setAttemptCount(0); 
        }
    };

    const resetPolling = () => {
        setData(null);
        setError(null);
        setAttemptCount(0);
        stopPolling();
    };

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            clearExistingTimeout();
        };
    }, []);

    // Auto-start polling when enabled changes to true
    useEffect(() => {
        console.log('🔄 Polling enabled changed:', enabled);
        if (enabled) {
            console.log('✅ Starting polling...');
            setIsPolling(true);
            setError(null);
        } else {
            console.log('⏹️ Stopping polling...');
            stopPolling();
        }
    }, [enabled]);

    useEffect(() => {
        if (!enabled) {
            console.log('⏹️ Polling disabled - stopping all activity');
            clearExistingTimeout();
            setIsPolling(false);
            return;
        }

        if (!isPolling) {
            console.log('⏸️ Polling paused');
            return;
        }

        let pollCount = 0;
        const MAX_SAFETY_POLLS = 100; // Safety limit to prevent infinite polling
        let isActive = true; // Flag to track if this effect is still active

        const poll = async () => {
            // Check if effect was cleaned up
            if (!isActive || !isMountedRef.current) {
                console.log('🛑 Polling stopped - effect cleaned up');
                return;
            }

            try {
                pollCount++;
                console.log(`🔄 Polling attempt #${pollCount}/${MAX_SAFETY_POLLS} (interval: ${interval}ms)`);

                // Safety check - force stop after too many attempts
                if (pollCount >= MAX_SAFETY_POLLS) {
                    console.error('🛑 SAFETY: Stopping polling after', MAX_SAFETY_POLLS, 'attempts');
                    stopPolling();
                    return;
                }

                // Check max attempts (use pollCount, NOT state variable)
                if (maxAttempts && pollCount >= maxAttempts) {
                    console.log('⚠️ Max attempts reached');
                    stopPolling();
                    onMaxAttemptsReached?.();
                    return;
                }

                const result = await queryFn();
                console.log('✅ Poll result received');

                if (!isMountedRef.current || !isActive) return;

                setData(result);
                setError(null);

                // Check if we should stop polling
                if (shouldStopPolling(result)) {
                    console.log('🛑 Stopping polling - condition met');
                    stopPolling();
                    onSuccess?.(result);
                    return;
                }

                // ⚡ CRITICAL: Schedule next poll ONLY if still active
                if (isMountedRef.current && isActive) {
                    console.log(`⏰ Scheduling next poll in ${interval}ms`);
                    timeoutRef.current = setTimeout(poll, interval);
                }
            } catch (err) {
                if (!isMountedRef.current || !isActive) return;

                const error = err instanceof Error ? err : new Error('Polling failed');
                setError(error);
                onError?.(error);

                // Continue polling on error unless explicitly stopped
                if (isMountedRef.current && isActive) {
                    console.log(`⏰ Scheduling retry in ${interval}ms after error`);
                    timeoutRef.current = setTimeout(poll, interval);
                }
            }
        };

        // Start first poll immediately
        console.log('🚀 Starting polling loop with interval:', interval);
        poll();

        return () => {
            console.log('🧹 Cleaning up polling effect');
            isActive = false; // Mark as inactive to stop any pending polls
            clearExistingTimeout();
        };
    }, [isPolling, enabled, interval]); // ⚡ CRITICAL: Removed attemptCount from dependencies!

    return {
        data,
        error,
        isPolling,
        attemptCount,
        stopPolling,
        startPolling,
        resetPolling,
    };
}

