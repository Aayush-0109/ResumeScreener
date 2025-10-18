import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import AuthService from '../services/authService';
import type { User, LoginCredentials, RegisterData } from '../api/types';

interface AuthStore {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    bootstrapping: boolean;
    error: string | null;

    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    getProfile: () => Promise<void>;
    clearAuth: () => void;
    clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
    persist(
        devtools(
            (set) => ({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                bootstrapping: true,
                error: null,

                login: async (credentials) => {
                    set({ isLoading: true, error: null });
                    try {
                        const response = await AuthService.login(credentials);
                        if (response.success && response.data) {
                            set({
                                user: response.data as any,
                                isAuthenticated: true,
                                isLoading: false
                            });
                        }
                    } catch (error: any) {
                        set({
                            error: error?.response?.data?.message || 'Login failed',
                            isLoading: false
                        });
                        throw error;
                    }
                },

                register: async (data) => {
                    set({ isLoading: true, error: null });
                    try {
                        const response = await AuthService.register(data);
                        if (response.success && response.data) {
                            set({
                                user: response.data as any,
                                isAuthenticated: true,
                                isLoading: false
                            });
                        }
                    } catch (error: any) {
                        set({
                            error: error?.response?.data?.message || 'Registration failed',
                            isLoading: false
                        });
                        throw error;
                    }
                },

                logout: async () => {
                    try {
                        await AuthService.logout();
                    } catch (error) {
                        console.error('Logout error:', error);
                    }
                    set({
                        user: null,
                        isAuthenticated: false,
                        error: null
                    });
                },

                getProfile: async () => {
                    set({ isLoading: true, error: null });
                    try {
                        const response = await AuthService.getProfile();
                        if (response.success && response.data) {
                            set({ user: response.data, isAuthenticated: true });
                        } else {
                            set({ user: null, isAuthenticated: false });
                        }
                    } catch (error: any) {
                        // Stay logged out on failure
                        set({ user: null, isAuthenticated: false });
                    } finally {
                        set({ isLoading: false, bootstrapping: false });
                    }
                },

                clearAuth: () => {
                    set({
                        user: null,
                        isAuthenticated: false,
                        error: null
                    });
                },

                clearError: () => {
                    set({ error: null });
                }
            }),
            { name: 'AuthStore' }
        ),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated
            })
        }
    )
);
