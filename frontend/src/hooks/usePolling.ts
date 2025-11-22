import { useEffect, useRef, useState } from 'react';

export interface PollingOptions<T> {
    interval: number; 
    maxAttempts?: number; 
    enabled?: boolean; 
    onSuccess?: (data: T) => void; 
    onError?: (error: Error) => void; 
    onMaxAttemptsReached?: () => void; 
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
        const MAX_SAFETY_POLLS = 100; 
        let isActive = true; 

        const poll = async () => {
            
            if (!isActive || !isMountedRef.current) {
                console.log('🛑 Polling stopped - effect cleaned up');
                return;
            }

            try {
                pollCount++;
                console.log(`🔄 Polling attempt #${pollCount}/${MAX_SAFETY_POLLS} (interval: ${interval}ms)`);

                
                if (pollCount >= MAX_SAFETY_POLLS) {
                    console.error('🛑 SAFETY: Stopping polling after', MAX_SAFETY_POLLS, 'attempts');
                    stopPolling();
                    return;
                }

                
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

                
                if (shouldStopPolling(result)) {
                    console.log('🛑 Stopping polling - condition met');
                    stopPolling();
                    onSuccess?.(result);
                    return;
                }

                
                if (isMountedRef.current && isActive) {
                    console.log(`⏰ Scheduling next poll in ${interval}ms`);
                    timeoutRef.current = setTimeout(poll, interval);
                }
            } catch (err) {
                if (!isMountedRef.current || !isActive) return;

                const error = err instanceof Error ? err : new Error('Polling failed');
                setError(error);
                onError?.(error);

                
                if (isMountedRef.current && isActive) {
                    console.log(`⏰ Scheduling retry in ${interval}ms after error`);
                    timeoutRef.current = setTimeout(poll, interval);
                }
            }
        };

        
        console.log('🚀 Starting polling loop with interval:', interval);
        poll();

        return () => {
            console.log('🧹 Cleaning up polling effect');
            isActive = false; 
            clearExistingTimeout();
        };
    }, [isPolling, enabled, interval]); 

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

