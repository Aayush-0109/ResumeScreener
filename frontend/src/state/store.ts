import { create } from 'zustand';

type UiState = {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
};

type AuthState = {
    userId: string | null;
    setUserId: (id: string | null) => void;
};

type AppState = UiState & AuthState;

export const useAppStore = create<AppState>((set) => ({
    sidebarOpen: false,
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    userId: null,
    setUserId: (id) => set({ userId: id })
}));


