import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, AxiosError } from 'axios';
import { toast } from '../utils/toast';
import { organizeError, getHumanMessage } from '../utils/error';
import { getEnv } from '../utils/env';
import { type ApiResponse } from './types';

const { VITE_API_URL } = getEnv();

const isDevelopment = () => import.meta.env.DEV;

export const createApiClient = (): AxiosInstance => {
    const client = axios.create({
        baseURL: VITE_API_URL,
        timeout: 30 * 1000,
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
    });

    // Prevent parallel refresh loops
    let isRefreshing = false as boolean;
    let refreshPromise: Promise<any> | null = null;

    client.interceptors.request.use(
        (config) => {
            const correlationId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
                ? crypto.randomUUID()
                : Math.random().toString(36).slice(2);

            config.headers = config.headers || {};
            (config.headers as any)['x-correlation-id'] = correlationId;

            // Bust caches for GETs to avoid stale data without adding disallowed headers
            const method = (config.method || 'get').toLowerCase();
            if (method === 'get') {
                config.params = { ...(config.params || {}), _ts: Date.now() } as any;
            }

            if (isDevelopment()) {
                (config as any).metadata = { startTime: new Date() };
            }

            return config;
        },
        (error: AxiosError) => {
            if (isDevelopment()) {
                console.error('Request Error:', error);
            }
            return Promise.reject(error);
        }
    );

    client.interceptors.response.use(
        (response) => {
            if (isDevelopment()) {
                const duration = new Date().getTime() - (response.config as any).metadata?.startTime?.getTime();
                console.log(`API Response: ${response.status} ${response.config.url} (${duration}ms)`);
            }
            return response;
        },
        async (error) => {
            const originalRequest: any = error.config || {};

            if (error.response?.status === 401 && !originalRequest._retry) {
                const url = originalRequest.url || '';
                if (url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/register') || url.includes('/auth/logout')) {
                    return Promise.reject(error);
                }

                originalRequest._retry = true;

                try {
                    if (!isRefreshing) {
                        isRefreshing = true;
                        refreshPromise = client.post('/auth/refresh', {});
                    }
                    const resp = await refreshPromise!;
                    if (resp.data?.success) {
                        return client(originalRequest);
                    }
                    throw new Error('Refresh token invalid');
                } catch (refreshError) {
                    const { useAuthStore } = await import('../state/authStore');
                    useAuthStore.getState().clearAuth();
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                    refreshPromise = null;
                }
            }

            // Centralized error toast
            try {
                const organized = organizeError(error);
                const msg = getHumanMessage(organized);
                toast.error(msg);
            } catch { }

            return Promise.reject(error);
        }
    );

    return client;
};

export const apiClient = createApiClient();

// Helper functions with typed responses
export const get = <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.get<ApiResponse<T>>(url, config);
};

export const post = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.post<ApiResponse<T>>(url, data, config);
};

export const put = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.put<ApiResponse<T>>(url, data, config);
};

export const del = <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.delete<ApiResponse<T>>(url, config);
};

export const patch = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.patch<ApiResponse<T>>(url, data, config);
};

export default apiClient;