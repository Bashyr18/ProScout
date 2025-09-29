import { StateCreator } from 'zustand';
import { produce } from 'immer';
import { AuthSlice, RootState, PlanId } from '../types.ts';
import * as db from '../services/db.ts';
import * as server from '../services/server.ts';
import * as agentManager from '../services/agentManager.ts';
import { PLAN_QUOTAS } from '../constants.ts';

export const createAuthSlice: StateCreator<
    RootState,
    [],
    [],
    AuthSlice
> = (set, get) => ({
    user: null,
    isAuthenticated: false,

    initAuth: async () => {
        await db.seedDeveloperUser();
        const user = await db.getSession();
        if (user) {
            set({ user, isAuthenticated: true });
        } else {
            set({ user: null, isAuthenticated: false });
        }
        get().initTheme();
        // Always trigger data load after auth attempt.
        // It will clear data if no user, or load data if a session exists.
        await get().loadUserData();
    },

    signUp: async (email, password, promoCode) => {
        const newUser = await db.createUser(email, password, promoCode);
        set({ user: newUser, isAuthenticated: true });
        get().initTheme();
        await get().loadUserData(); // Centralized data loading
        return newUser;
    },

    login: async (email, password) => {
        const user = await db.loginUser(email, password);
        set({ user, isAuthenticated: true });
        get().initTheme();
        await get().loadUserData(); // Centralized data loading
        return user;
    },

    logout: async () => {
        agentManager.stop(); // Stop background tasks first
        await db.clearSession();
        set({ user: null, isAuthenticated: false });
        await get().loadUserData(); // Centralized data clearing
    },

    updateUserProfile: (details: { name: string, profile: string }) => {
        set(produce(state => {
            if (state.user) {
                state.user.companyName = details.name;
                state.user.companyProfile = details.profile;
                db.updateUser(state.user);
            }
        }));
    },
    
    changePassword: async (newPassword) => {
        const { user } = get();
        if(user) {
            await db.updatePassword(user.id, newPassword);
            // No need to set state, as user object doesn't change from this component's perspective
        }
    },

    hasQuota: (action) => {
        const { user } = get();
        if (!user) return false;
        const limit = PLAN_QUOTAS[user.planId][action];
        return limit === 'unlimited' || user.usage[action] < limit;
    },

    canExport: () => {
        const { user } = get();
        return user?.planId === 'pro' || user?.planId === 'lifetime';
    },

    canCustomizeProfile: () => {
        const { user } = get();
        return user?.planId === 'pro' || user?.planId === 'lifetime';
    },
    
    hasProFeatures: () => {
        const { user } = get();
        return user?.planId === 'pro' || user?.planId === 'lifetime';
    },

    initiatePayment: async (planId) => {
        const { user } = get();
        if (!user) {
            get().addToast({ type: 'error', message: 'Please log in to upgrade your plan.' });
            return;
        };

        get().setIsInitiatingPayment(true);
        get().setPaymentError(null);
        try {
            await server.initializePaymentTransaction(user, planId);
            // The server file now handles the redirect via Flutterwave's library.
        } catch (e) {
            get().setPaymentError((e as Error).message);
        } finally {
            // Do not set isInitiatingPayment to false here, as the page will redirect.
        }
    },

    verifyPayment: async (params) => {
        get().setIsInitiatingPayment(true);
        get().setPaymentError(null);
        try {
            const verification = await server.verifyPaymentTransaction(params);
            if (verification.success && verification.userId) {
                await db.upgradeUserPlan(verification.userId, verification.planId);
                // Re-initialize auth and load all user data to reflect the new plan
                await get().initAuth();
            } else {
                 throw new Error(verification.message || "Payment verification failed.");
            }
        } catch (e) {
            get().setPaymentError((e as Error).message);
        } finally {
            get().setIsInitiatingPayment(false);
        }
    },
});