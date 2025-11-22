import axios, { AxiosError,type  InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';


export interface StandardResponse<T = any> {
    success: boolean;
    message: string;
    data: T;
    errors?: any;
    meta?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, 
});


api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        
        
        
        
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);


api.interceptors.response.use(
    (response) => {
        
        
        return response;
    },
    (error: AxiosError<StandardResponse>) => {
        const { response } = error;

        
        let message = 'An unexpected error occurred';

        if (response) {
            
            const data = response.data;
            message = data.message || message;

            
            switch (response.status) {
                case 401:
                    
                    
                    if (!window.location.pathname.includes('/auth')) {
                        
                        
                    }
                    break;
                case 403:
                    toast.error('You do not have permission to perform this action.');
                    break;
                case 404:
                    
                    break;
                case 422:
                    
                    if (data.errors) {
                        
                        toast.error(message);
                    } else {
                        toast.error(message);
                    }
                    break;
                case 500:
                    toast.error('Server error. Please try again later.');
                    break;
                default:
                    toast.error(message);
            }
        } else if (error.request) {
            
            message = 'Network error. Please check your connection.';
            toast.error(message);
        } else {
            
            toast.error(message);
        }

        return Promise.reject(error);
    }
);


export const getData = <T>(response: { data: StandardResponse<T> }): T => {
    return response.data.data;
};
