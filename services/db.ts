import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { produce } from 'immer';
import { User, Opportunity, PlanId, SavedSearch, Agent } from '../types.ts';
import { PLAN_QUOTAS } from '../constants.ts';
import { hashPassword, verifyPassword } from '../utils/auth.ts';

const DB_NAME = 'ProScoutDB';
const DB_VERSION = 5; // Incremented version for schema change (agents)
const USERS_STORE = 'users';
const OPPORTUNITIES_STORE = 'opportunities';
const SAVED_SEARCHES_STORE = 'saved_searches';
const AGENTS_STORE = 'agents';
const SESSION_STORE = 'session';
const META_STORE = 'meta';

interface ProScoutDBSchema extends DBSchema {
    [USERS_STORE]: {
        key: string;
        value: User;
        indexes: { 'by-email': string };
    };
    [OPPORTUNITIES_STORE]: {
        key: string;
        value: Opportunity;
        indexes: { 'by-userId': string };
    };
    [SAVED_SEARCHES_STORE]: {
        key: string;
        value: SavedSearch;
        indexes: { 'by-userId': string };
    };
    [AGENTS_STORE]: {
        key: string;
        value: Agent;
        indexes: { 'by-userId': string };
    };
    [SESSION_STORE]: {
        key: string;
        value: User;
    };
     [META_STORE]: {
        key: string;
        value: { key: string; seeded: boolean };
    };
}

let dbPromise: Promise<IDBPDatabase<ProScoutDBSchema>> | null = null;

function getDb() {
    if (!dbPromise) {
        dbPromise = openDB<ProScoutDBSchema>(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion, newVersion, tx) {
                if (!db.objectStoreNames.contains(USERS_STORE)) {
                    const usersStore = db.createObjectStore(USERS_STORE, { keyPath: 'id' });
                    usersStore.createIndex('by-email', 'email', { unique: true });
                }
                if (!db.objectStoreNames.contains(SESSION_STORE)) {
                    db.createObjectStore(SESSION_STORE, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(OPPORTUNITIES_STORE)) {
                     const opportunitiesStore = db.createObjectStore(OPPORTUNITIES_STORE, { keyPath: 'id' });
                     opportunitiesStore.createIndex('by-userId', 'userId', { unique: false });
                }
                if (!db.objectStoreNames.contains(META_STORE)) {
                    db.createObjectStore(META_STORE, { keyPath: 'key' });
                }

                if (oldVersion < 4) {
                    if (!db.objectStoreNames.contains(SAVED_SEARCHES_STORE)) {
                        const savedSearchesStore = db.createObjectStore(SAVED_SEARCHES_STORE, { keyPath: 'id' });
                        savedSearchesStore.createIndex('by-userId', 'userId', { unique: false });
                    }
                }
                if (oldVersion < 5) {
                    if (!db.objectStoreNames.contains(AGENTS_STORE)) {
                        const agentsStore = db.createObjectStore(AGENTS_STORE, { keyPath: 'id' });
                        agentsStore.createIndex('by-userId', 'userId', { unique: false });
                    }
                }
            },
        });
    }
    return dbPromise;
}

// --- Developer User Seeding ---
export async function seedDeveloperUser(): Promise<void> {
    const db = await getDb();
    const seededMeta = await db.get(META_STORE, 'dev-user');
    if (seededMeta?.seeded) return;

    const devEmail = 'dev@proscout.ai';
    const existingDev = await db.getFromIndex(USERS_STORE, 'by-email', devEmail);
    if (!existingDev) {
        console.log('Seeding developer account...');
        const passwordHash = await hashPassword('password123');
        const devUser: User = {
            id: crypto.randomUUID(),
            email: devEmail,
            passwordHash,
            planId: 'lifetime',
            companyName: 'ProScout Dev',
            companyProfile: `ProScout is a premier consultancy firm specializing in infrastructure finance and public-private partnerships (PPPs) across emerging markets, with a strong focus on Africa. Our core expertise lies in transaction advisory, feasibility studies, and the development of robust business cases (OBCs) for large-scale projects in the energy (especially solar and mini-grids), transport, and climate resilience sectors. We have a proven track record of securing funding and delivering successful projects for major international development banks like the World Bank, African Development Bank (AfDB), and UNDP.`,
            usage: { agentDispatches: 0, insightsGenerations: 0, chatMessages: 0 }
        };
        await db.add(USERS_STORE, devUser);
    }
    await db.put(META_STORE, { key: 'dev-user', seeded: true });
}

// --- Session Management ---
export async function setSession(user: User): Promise<void> {
    const db = await getDb();
    await db.clear(SESSION_STORE);
    await db.put(SESSION_STORE, user);
}

export async function getSession(): Promise<User | null> {
    const db = await getDb();
    const allSessions = await db.getAll(SESSION_STORE);
    return allSessions.length > 0 ? allSessions[0] : null;
}

export async function clearSession(): Promise<void> {
    const db = await getDb();
    await db.clear(SESSION_STORE);
}


// --- User Management ---
export async function getUser(userId: string): Promise<User | undefined> {
    const db = await getDb();
    return db.get(USERS_STORE, userId);
}

export async function createUser(email: string, password: string, promoCode?: string): Promise<User> {
    const db = await getDb();
    const existingUser = await db.getFromIndex(USERS_STORE, 'by-email', email);
    if (existingUser) {
        throw new Error('An account with this email already exists.');
    }
    const passwordHash = await hashPassword(password);
    
    const planId: PlanId = (promoCode?.toUpperCase() === 'ADMIN005500') ? 'lifetime' : 'free';

    const newUser: User = {
        id: crypto.randomUUID(),
        email,
        passwordHash,
        planId,
        companyName: '',
        companyProfile: '',
        usage: { agentDispatches: 0, insightsGenerations: 0, chatMessages: 0 }
    };
    await db.add(USERS_STORE, newUser);
    await setSession(newUser);
    return newUser;
}

export async function loginUser(email: string, password: string): Promise<User> {
    const db = await getDb();
    const user = await db.getFromIndex(USERS_STORE, 'by-email', email);
    if (!user || !user.passwordHash) {
        throw new Error('Invalid email or password.');
    }
    const isPasswordCorrect = await verifyPassword(password, user.passwordHash);
    if (!isPasswordCorrect) {
        throw new Error('Invalid email or password.');
    }
    await setSession(user);
    return user;
}

export async function updateUser(user: User): Promise<void> {
    if (!user) {
        console.warn("Attempted to update user with a null value. Operation aborted.");
        return;
    }
    const db = await getDb();
    await db.put(USERS_STORE, user);
    const sessionUser = await getSession();
    if (sessionUser?.id === user.id) {
        await setSession(user);
    }
}

export async function updatePassword(userId: string, newPassword: string):Promise<void> {
    const db = await getDb();
    const user = await db.get(USERS_STORE, userId);
    if (!user) {
        throw new Error("User not found.");
    }
    const passwordHash = await hashPassword(newPassword);
    const updatedUser = { ...user, passwordHash };
    await updateUser(updatedUser);
}

export async function upgradeUserPlan(userId: string, planId: PlanId): Promise<User> {
    const db = await getDb();
    const user = await db.get(USERS_STORE, userId);
    if (!user) {
        throw new Error("User not found during plan upgrade.");
    }
    const updatedUser = { ...user, planId: planId };
    await updateUser(updatedUser);
    return updatedUser;
}

// --- Quota Management ---
export async function checkAndDecrementQuota(userId: string, action: keyof User['usage']): Promise<boolean> {
    const db = await getDb();
    const tx = db.transaction(USERS_STORE, 'readwrite');
    const userStore = tx.objectStore(USERS_STORE);
    const user = await userStore.get(userId);

    if (!user) {
        await tx.done;
        return false;
    }

    const limit = PLAN_QUOTAS[user.planId][action];
    const currentUsage = user.usage[action];

    if (limit !== 'unlimited' && currentUsage >= limit) {
        await tx.done;
        return false;
    }

    const updatedUser = produce(user, draft => {
        draft.usage[action] += 1;
    });

    await userStore.put(updatedUser);
    await tx.done;
    
    const sessionUser = await getSession();
    if(sessionUser?.id === userId) {
        await setSession(updatedUser);
    }

    return true;
}


// --- Opportunity Management ---
export async function getOpportunities(userId: string): Promise<Opportunity[]> {
    const db = await getDb();
    return await db.getAllFromIndex(OPPORTUNITIES_STORE, 'by-userId', userId);
}

export async function addOpportunity(opportunity: Opportunity): Promise<void> {
    const db = await getDb();
    await db.add(OPPORTUNITIES_STORE, opportunity);
}

export async function addOpportunities(opportunities: Opportunity[]): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(OPPORTUNITIES_STORE, 'readwrite');
    await Promise.all(opportunities.map(op => tx.store.add(op)));
    await tx.done;
}

export async function updateOpportunity(opportunity: Opportunity): Promise<void> {
    if (!opportunity) {
        console.warn("Attempted to update opportunity with a null value. Operation aborted.");
        return;
    }
    const db = await getDb();
    await db.put(OPPORTUNITIES_STORE, opportunity);
}

export async function deleteOpportunity(id: string): Promise<void> {
    const db = await getDb();
    await db.delete(OPPORTUNITIES_STORE, id);
}

export async function clearOpportunities(userId: string): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(OPPORTUNITIES_STORE, 'readwrite');
    const userOppKeys = await tx.store.index('by-userId').getAllKeys(userId);
    await Promise.all(userOppKeys.map(key => tx.store.delete(key)));
    await tx.done;
}

// --- Saved Search Management ---
export async function getSavedSearches(userId: string): Promise<SavedSearch[]> {
    const db = await getDb();
    return await db.getAllFromIndex(SAVED_SEARCHES_STORE, 'by-userId', userId);
}

export async function addSavedSearch(search: SavedSearch): Promise<void> {
    const db = await getDb();
    await db.add(SAVED_SEARCHES_STORE, search);
}

export async function deleteSavedSearch(id: string): Promise<void> {
    const db = await getDb();
    await db.delete(SAVED_SEARCHES_STORE, id);
}

// --- Persistent Agent Management ---
export async function getAgents(userId: string): Promise<Agent[]> {
    const db = await getDb();
    return await db.getAllFromIndex(AGENTS_STORE, 'by-userId', userId);
}

export async function addAgent(agent: Agent): Promise<void> {
    const db = await getDb();
    await db.add(AGENTS_STORE, agent);
}

export async function updateAgent(agent: Agent): Promise<void> {
    const db = await getDb();
    await db.put(AGENTS_STORE, agent);
}

export async function deleteAgent(id: string): Promise<void> {
    const db = await getDb();
    await db.delete(AGENTS_STORE, id);
}