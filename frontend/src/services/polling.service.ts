/**
 * Centralized Polling Service
 * Handles polling logic with abort controller, retry, and memory leak prevention
 */

export interface PollingConfig {
    interval: number; // milliseconds
    maxAttempts?: number; // undefined = infinite
    onProgress?: (attempt: number, data: any) => void;
    onError?: (error: any, attempt: number) => boolean; // return true to retry
    signal?: AbortSignal; // For external cancellation
}

export interface PollingResult<T> {
    data: T;
    attempts: number;
    duration: number; // milliseconds
}

class PollingService {
    private activePolls = new Map<string, AbortController>();

    /**
     * Generic polling function with exponential backoff
     */
    async poll<T>(
        id: string,
        queryFn: (signal: AbortSignal) => Promise<T>,
        shouldStopPolling: (data: T) => boolean,
        config: PollingConfig
    ): Promise<PollingResult<T>> {
        // Cancel any existing poll with this ID
        this.cancelPoll(id);

        const controller = new AbortController();
        this.activePolls.set(id, controller);

        const startTime = Date.now();
        let attempts = 0;
        let lastError: any = null;

        try {
            while (true) {
                // Check for cancellation
                if (controller.signal.aborted || config.signal?.aborted) {
                    throw new Error('Polling cancelled');
                }

                // Check max attempts
                if (config.maxAttempts && attempts >= config.maxAttempts) {
                    throw new Error(`Max polling attempts (${config.maxAttempts}) reached`);
                }

                attempts++;

                try {
                    // Execute query
                    const data = await queryFn(controller.signal);

                    // Call progress callback
                    config.onProgress?.(attempts, data);

                    // Check if we should stop polling
                    if (shouldStopPolling(data)) {
                        const duration = Date.now() - startTime;
                        return { data, attempts, duration };
                    }

                    lastError = null;
                } catch (error: any) {
                    lastError = error;

                    // Check if abort was the cause
                    if (error.name === 'AbortError' || error.name === 'CanceledError') {
                        throw new Error('Polling cancelled');
                    }

                    // Call error handler
                    const shouldRetry = config.onError?.(error, attempts) ?? true;
                    if (!shouldRetry) {
                        throw error;
                    }

                    console.warn(`Polling attempt ${attempts} failed, retrying...`, error);
                }

                // Wait before next attempt (with exponential backoff for errors)
                const waitTime = lastError
                    ? Math.min(config.interval * Math.pow(1.5, attempts - 1), 30000) // Max 30s backoff
                    : config.interval;

                await this.sleep(waitTime, controller.signal);
            }
        } finally {
            // Cleanup
            this.activePolls.delete(id);
        }
    }

    /**
     * Poll parse status with smart completion detection
     */
    async pollParseStatus(
        queueId: string,
        queryFn: (signal: AbortSignal) => Promise<any>,
        config: Partial<PollingConfig> = {}
    ): Promise<PollingResult<any>> {
        return this.poll(
            `parse-${queueId}`,
            queryFn,
            (data) => {
                const status = data?.data?.status || data?.status;
                return ['COMPLETED', 'FAILED', 'CANCELLED'].includes(status);
            },
            {
                interval: 2000, // 2 seconds
                maxAttempts: 150, // 5 minutes max (150 * 2s)
                ...config
            }
        );
    }

    /**
     * Poll match status with smart completion detection
     */
    async pollMatchStatus(
        queueId: string,
        queryFn: (signal: AbortSignal) => Promise<any>,
        config: Partial<PollingConfig> = {}
    ): Promise<PollingResult<any>> {
        return this.poll(
            `match-${queueId}`,
            queryFn,
            (data) => {
                const status = data?.data?.status || data?.status;
                return ['COMPLETED', 'FAILED', 'CANCELLED'].includes(status);
            },
            {
                interval: 2000, // 2 seconds
                maxAttempts: 300, // 10 minutes max (300 * 2s)
                ...config
            }
        );
    }

    /**
     * Cancel a specific poll by ID
     */
    cancelPoll(id: string): void {
        const controller = this.activePolls.get(id);
        if (controller) {
            controller.abort();
            this.activePolls.delete(id);
        }
    }

    /**
     * Cancel all active polls
     */
    cancelAllPolls(): void {
        this.activePolls.forEach((controller) => controller.abort());
        this.activePolls.clear();
    }

    /**
     * Get active poll count
     */
    getActivePollCount(): number {
        return this.activePolls.size;
    }

    /**
     * Check if a specific poll is active
     */
    isPollActive(id: string): boolean {
        return this.activePolls.has(id);
    }

    /**
     * Sleep with abort support
     */
    private sleep(ms: number, signal?: AbortSignal): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(resolve, ms);

            const onAbort = () => {
                clearTimeout(timeout);
                reject(new Error('Sleep aborted'));
            };

            if (signal) {
                signal.addEventListener('abort', onAbort, { once: true });
            }
        });
    }
}

// Export singleton instance
export default new PollingService();

