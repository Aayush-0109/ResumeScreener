import { get, post } from '../api/client';
import type { ApiResponse, User, LoginCredentials, RegisterData, AuthResponse } from '../api/types';

class AuthService {
    static async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
        const response = await post<AuthResponse>('/auth/register', data);
        return response.data;
    }

    static async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
        const response = await post<AuthResponse>('/auth/login', credentials);
        return response.data;
    }

    static async logout(): Promise<ApiResponse<null>> {
        const response = await post<null>(`/auth/logout`);
        return response.data;
    }

    static async refreshToken(): Promise<ApiResponse<AuthResponse>> {
        const response = await post<AuthResponse>('/auth/refresh');
        return response.data;
    }

    static async getProfile(): Promise<ApiResponse<User>> {
        const response = await get<User>(`/auth/profile`);
        return response.data;
    }
}

export default AuthService;
