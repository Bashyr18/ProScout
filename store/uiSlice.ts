import { StateCreator } from 'zustand';
import { produce } from 'immer';
import { UISlice, RootState, Agent, SearchParams, Toast, Theme } from '../types.ts';

export const createUISlice: StateCreator<
    RootState,
    [],
    [],
    UISlice
> = (set, get) => ({
    sidebarWidth: 384, // xl:w-96
    lastSearchReport: null,
    isInitiatingPayment: false,
    paymentError: null,
    theme: 'dark',
    activeView: 'table',
    isKeywordBoostEnabled: false, // Default to false for user precision
    isExploratorySearchEnabled: false,
    newlyAddedOpportunityIds: [],
    toasts: [],
    
    setSidebarWidth: (width) => set({ sidebarWidth: Math.max(320, Math.min(width, 600)) }),
    setLastSearchReport: (report) => set({ lastSearchReport: report }),
    setIsInitiatingPayment: (isLoading) => set({ isInitiatingPayment: isLoading }),
    setPaymentError: (error) => set({ paymentError: error }),
    setNewlyAddedOpportunityIds: (ids) => set({ newlyAddedOpportunityIds: ids }),
    addToast: (toast) => {
        const id = crypto.randomUUID();
        set(produce((state: RootState) => {
            state.toasts.push({ ...toast, id });
        }));
        setTimeout(() => get().removeToast(id), toast.duration || 5000);
    },
    removeToast: (id) => {
        set(produce((state: RootState) => {
            state.toasts = state.toasts.filter((t: Toast) => t.id !== id);
        }));
    },
    setTheme: (theme) => {
        set({ theme });
        localStorage.setItem('proscout-theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    },
    initTheme: () => {
        const storedTheme = localStorage.getItem('proscout-theme') as Theme | null;
        if (storedTheme) {
            get().setTheme(storedTheme);
            return;
        }

        if (get().hasProFeatures()) {
            get().setTheme('midnight');
            return;
        }

        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = systemPrefersDark ? 'dark' : 'light';
        get().setTheme(initialTheme);
    },
    setActiveView: (view) => {
        // When switching away from agents, reset opportunity search query
        if (get().activeView === 'agents' && view !== 'agents') {
            get().setClientSearchQuery('');
        }
        set({ activeView: view });
    },
    setIsKeywordBoostEnabled: (isEnabled) => {
        set({ isKeywordBoostEnabled: isEnabled });
        localStorage.setItem('proscout-keyword-boost', JSON.stringify(isEnabled));
    },
    initKeywordBoost: () => {
        const stored = localStorage.getItem('proscout-keyword-boost');
        // Default to false for more precise user control, making it an opt-in feature.
        const initialValue = stored ? JSON.parse(stored) : false;
        get().setIsKeywordBoostEnabled(initialValue);
    },
    setIsExploratorySearchEnabled: (isEnabled) => {
        set({ isExploratorySearchEnabled: isEnabled });
        localStorage.setItem('proscout-exploratory-search', JSON.stringify(isEnabled));
    },
    initExploratorySearch: () => {
        const stored = localStorage.getItem('proscout-exploratory-search');
        const initialValue = stored ? JSON.parse(stored) : false;
        get().setIsExploratorySearchEnabled(initialValue);
    },
});