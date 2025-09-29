import { create } from 'zustand';
import { RootState } from '../types.ts';
import { createAuthSlice } from './authSlice.ts';
import { createOpportunitySlice } from './opportunitySlice.ts';
import { createUISlice } from './uiSlice.ts';
import { createAgentSlice } from './agentSlice.ts';

export const useAppStore = create<RootState>((set, get, store) => ({
    ...createAuthSlice(set, get, store),
    ...createOpportunitySlice(set, get, store),
    ...createUISlice(set, get, store),
    ...createAgentSlice(set, get, store),

    // --- GLOBAL ACTIONS ---
    init: async () => {
        get().initKeywordBoost();
        get().initExploratorySearch();
        // Authentication is the first step. Data loading will be triggered by auth actions.
        await get().initAuth();
    },
    
    loadUserData: async () => {
        const { user, initOpportunities, loadSavedSearches, loadAgents } = get();
        if (user) {
            // Load all user-specific data in parallel for efficiency
            await Promise.all([
                initOpportunities(),
                loadSavedSearches(),
                loadAgents(),
            ]);
        } else {
            // If there's no user, clear the data from all slices
            initOpportunities();
            loadSavedSearches();
            loadAgents();
        }
    },
}));