import axios from 'axios';
import { getEnv } from '../utils/env';

const { VITE_API_URL } = getEnv();

export const api = axios.create({
    baseURL: VITE_API_URL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
    const correlationId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    config.headers = config.headers || {};
    (config.headers as any)['x-correlation-id'] = correlationId;
    return config;
});

api.interceptors.response.use(
    (resp) => resp,
    (error) => {
        const status = error?.response?.status || 0;
        const message = error?.response?.data?.message || error.message;
        return Promise.reject({ status, message, data: error?.response?.data });
    }
);


