import { create } from 'zustand';
import { devtools } from 'zustand/middleware';


export interface ActivePollingJob {
    id: string;
    type: 'parse' | 'match';
    jobId?: string; 
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    progress?: number; 
    startedAt: number; 
}


export type ModalType =
    | 'upload-resumes'
    | 'parse-progress'
    | 'create-job'
    | 'edit-job'
    | 'match-config'
    | 'match-progress'
    | 'delete-confirm'
    | 'clear-confirm'
    | 'bulk-action'
    | 'export-menu';

export interface ModalState {
    type: ModalType;
    isOpen: boolean;
    data?: any; 
}


export interface NotificationPreferences {
    parseComplete: boolean;
    parseFailed: boolean;
    matchComplete: boolean;
    matchFailed: boolean;
    sound: boolean;
}

interface UIStore {
    
    modals: Map<ModalType, ModalState>;
    openModal: (type: ModalType, data?: any) => void;
    closeModal: (type: ModalType) => void;
    closeAllModals: () => void;
    isModalOpen: (type: ModalType) => boolean;
    getModalData: (type: ModalType) => any;

    
    activePollingJobs: Map<string, ActivePollingJob>;
    addPollingJob: (job: ActivePollingJob) => void;
    updatePollingJob: (id: string, updates: Partial<ActivePollingJob>) => void;
    removePollingJob: (id: string) => void;
    getPollingJob: (id: string) => ActivePollingJob | undefined;
    getAllPollingJobs: () => ActivePollingJob[];
    getActiveParseJobs: () => ActivePollingJob[];
    getActiveMatchJobs: () => ActivePollingJob[];
    hasActivePolling: () => boolean;

    
    globalLoading: boolean;
    setGlobalLoading: (loading: boolean) => void;

    
    sidebarCollapsed: boolean;
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;

    
    notificationPreferences: NotificationPreferences;
    setNotificationPreferences: (prefs: Partial<NotificationPreferences>) => void;

    
    activeToasts: Set<string>;
    addToast: (id: string) => void;
    removeToast: (id: string) => void;
}

const defaultNotificationPreferences: NotificationPreferences = {
    parseComplete: true,
    parseFailed: true,
    matchComplete: true,
    matchFailed: true,
    sound: false
};

export const useUIStore = create<UIStore>()(
    devtools(
        (set, get) => ({
            
            modals: new Map(),

            openModal: (type, data) => {
                set((state) => {
                    const newModals = new Map(state.modals);
                    newModals.set(type, { type, isOpen: true, data });
                    return { modals: newModals };
                });
            },

            closeModal: (type) => {
                set((state) => {
                    const newModals = new Map(state.modals);
                    newModals.delete(type);
                    return { modals: newModals };
                });
            },

            closeAllModals: () => {
                set({ modals: new Map() });
            },

            isModalOpen: (type) => {
                return get().modals.get(type)?.isOpen ?? false;
            },

            getModalData: (type) => {
                return get().modals.get(type)?.data;
            },

            
            activePollingJobs: new Map(),

            addPollingJob: (job) => {
                set((state) => {
                    const newJobs = new Map(state.activePollingJobs);
                    newJobs.set(job.id, job);
                    return { activePollingJobs: newJobs };
                });
            },

            updatePollingJob: (id, updates) => {
                set((state) => {
                    const newJobs = new Map(state.activePollingJobs);
                    const existingJob = newJobs.get(id);
                    if (existingJob) {
                        newJobs.set(id, { ...existingJob, ...updates });
                    }
                    return { activePollingJobs: newJobs };
                });
            },

            removePollingJob: (id) => {
                set((state) => {
                    const newJobs = new Map(state.activePollingJobs);
                    newJobs.delete(id);
                    return { activePollingJobs: newJobs };
                });
            },

            getPollingJob: (id) => {
                return get().activePollingJobs.get(id);
            },

            getAllPollingJobs: () => {
                return Array.from(get().activePollingJobs.values());
            },

            getActiveParseJobs: () => {
                return Array.from(get().activePollingJobs.values())
                    .filter(job => job.type === 'parse' && ['PENDING', 'PROCESSING'].includes(job.status));
            },

            getActiveMatchJobs: () => {
                return Array.from(get().activePollingJobs.values())
                    .filter(job => job.type === 'match' && ['PENDING', 'PROCESSING'].includes(job.status));
            },

            hasActivePolling: () => {
                return Array.from(get().activePollingJobs.values())
                    .some(job => ['PENDING', 'PROCESSING'].includes(job.status));
            },

            
            globalLoading: false,

            setGlobalLoading: (loading) => {
                set({ globalLoading: loading });
            },

            
            sidebarCollapsed: false,

            toggleSidebar: () => {
                set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
            },

            setSidebarCollapsed: (collapsed) => {
                set({ sidebarCollapsed: collapsed });
            },

            
            notificationPreferences: defaultNotificationPreferences,

            setNotificationPreferences: (prefs) => {
                set((state) => ({
                    notificationPreferences: { ...state.notificationPreferences, ...prefs }
                }));
            },

            
            activeToasts: new Set(),

            addToast: (id) => {
                set((state) => {
                    const newToasts = new Set(state.activeToasts);
                    newToasts.add(id);
                    return { activeToasts: newToasts };
                });
            },

            removeToast: (id) => {
                set((state) => {
                    const newToasts = new Set(state.activeToasts);
                    newToasts.delete(id);
                    return { activeToasts: newToasts };
                });
            }
        }),
        { name: 'UIStore' }
    )
);

