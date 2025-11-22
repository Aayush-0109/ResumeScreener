

export interface PollingConfig {
    interval: number; 
    maxAttempts?: number; 
    onProgress?: (attempt: number, data: any) => void;
    onError?: (error: any, attempt: number) => boolean; 
    signal?: AbortSignal; 
}

export interface PollingResult<T> {
    data: T;
    attempts: number;
    duration: number; 
}

class PollingService {
    private activePolls = new Map<string, AbortController>();

    
    async poll<T>(
        id: string,
        queryFn: (signal: AbortSignal) => Promise<T>,
        shouldStopPolling: (data: T) => boolean,
        config: PollingConfig
    ): Promise<PollingResult<T>> {
        
        this.cancelPoll(id);

        const controller = new AbortController();
        this.activePolls.set(id, controller);

        const startTime = Date.now();
        let attempts = 0;
        let lastError: any = null;

        try {
            while (true) {
                
                if (controller.signal.aborted || config.signal?.aborted) {
                    throw new Error('Polling cancelled');
                }

                
                if (config.maxAttempts && attempts >= config.maxAttempts) {
                    throw new Error(`Max polling attempts (${config.maxAttempts}) reached`);
                }

                attempts++;

                try {
                    
                    const data = await queryFn(controller.signal);

                    
                    config.onProgress?.(attempts, data);

                    
                    if (shouldStopPolling(data)) {
                        const duration = Date.now() - startTime;
                        return { data, attempts, duration };
                    }

                    lastError = null;
                } catch (error: any) {
                    lastError = error;

                    
                    if (error.name === 'AbortError' || error.name === 'CanceledError') {
                        throw new Error('Polling cancelled');
                    }

                    
                    const shouldRetry = config.onError?.(error, attempts) ?? true;
                    if (!shouldRetry) {
                        throw error;
                    }

                    console.warn(`Polling attempt ${attempts} failed, retrying...`, error);
                }

                
                const waitTime = lastError
                    ? Math.min(config.interval * Math.pow(1.5, attempts - 1), 30000) 
                    : config.interval;

                await this.sleep(waitTime, controller.signal);
            }
        } finally {
            
            this.activePolls.delete(id);
        }
    }

    
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
                interval: 2000, 
                maxAttempts: 150, 
                ...config
            }
        );
    }

    
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
                interval: 2000, 
                maxAttempts: 300, 
                ...config
            }
        );
    }

    
    cancelPoll(id: string): void {
        const controller = this.activePolls.get(id);
        if (controller) {
            controller.abort();
            this.activePolls.delete(id);
        }
    }

    
    cancelAllPolls(): void {
        this.activePolls.forEach((controller) => controller.abort());
        this.activePolls.clear();
    }

    
    getActivePollCount(): number {
        return this.activePolls.size;
    }

    
    isPollActive(id: string): boolean {
        return this.activePolls.has(id);
    }

    
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


export default new PollingService();

