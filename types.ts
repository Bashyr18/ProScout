import { PLAN_IDS, OPPORTUNITY_STATUSES, AGENT_STATUSES } from './constants.ts';

export type PlanId = typeof PLAN_IDS[number];
export type OpportunityStatus = typeof OPPORTUNITY_STATUSES[number];
export type AgentStatus = typeof AGENT_STATUSES[number];

// This is what the AI service stream yields.
export type RawStreamedOpportunity = Omit<Opportunity, 'id' | 'userId' | 'Relevance' | 'status' | 'chatHistory' | 'manuallyAdded' | 'foundAt'>;

// A discriminated union for events from the search stream
export type SearchStreamEvent = 
    | { type: 'progress'; data: { message: string } }
    | { type: 'opportunity'; data: RawStreamedOpportunity };


export interface Opportunity {
    id: string;
    userId: string;
    Organization: string;
    Title: string;
    Location: string;
    'Published Date': string | null;
    Deadline: string | null;
    URL: string | null; // Direct link to a document (PDF, DOC), can be null
    noticePageUrl: string; // Direct link to the tender notice webpage
    Source: string;
    Relevance: number;
    citations: { title: string; uri: string }[];
    manuallyAdded?: boolean;
    status: OpportunityStatus;
    chatHistory?: { role: 'user' | 'model'; parts: { text: string }[] }[];
    Stage?: string;
    Budget?: string;
    // New fields
    Sector?: string;
    SubmissionMethod?: string;
    FundingSource?: string;
    foundAt: number; // UTC timestamp of when it was discovered
}

export type LocationScope = 'Global' | 'Continent' | 'Region' | 'Country';

export interface Location {
    scope: LocationScope;
    value: string;
}

export interface SearchParams {
    query: string;
    location: Location;
    organizations: string;
}

export interface SavedSearch {
    id: string;
    userId: string;
    name: string;
    params: SearchParams;
}

export interface AgentMission {
    params: SearchParams;
    systemInstruction: string;
    userPrompt: string;
}

export type ProgressReport = {
    phase: 'searching' | 'complete' | 'error';
    message: string;
    count?: number;
};

export interface User {
    id: string;
    email: string;
    passwordHash?: string; // Hashed password
    planId: PlanId;
    companyName: string;
    companyProfile: string;
    usage: {
        agentDispatches: number;
        insightsGenerations: number;
        chatMessages: number;
    }
}

// --- NEW TYPES FOR ADVANCED FEATURES ---

export interface AdvancedFilters {
    status: OpportunityStatus[];
    relevance: [number, number]; // [min, max]
    deadline: { start: string | null; end: string | null };
}

export interface Agent {
    id:string;
    userId: string;
    name: string;
    searchParams: SearchParams;
    frequency: number; // in milliseconds
    createdAt: number; // timestamp
    lastRun: number | null;
    status: AgentStatus;
    lastFoundCount: number;
}

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    duration?: number;
}

// --- ZUSTAND SLICE TYPES ---

// Agent Slice
export interface AgentSliceState {
    agentsById: Record<string, Agent>;
    agentIds: string[];
}
export interface AgentSliceActions {
    loadAgents: () => Promise<void>;
    createAgent: (name: string, searchParams: SearchParams, frequency: number) => Promise<void>;
    updateAgent: (id: string, updates: Partial<Pick<Agent, 'name' | 'searchParams' | 'frequency'>>) => Promise<void>;
    deleteAgent: (id: string) => Promise<void>;
    toggleAgentStatus: (id: string) => Promise<void>;
    runAgentMission: (agentId: string) => Promise<void>;
}
export type AgentSlice = AgentSliceState & AgentSliceActions;

// Auth Slice
export interface AuthSliceState {
    user: User | null;
    isAuthenticated: boolean;
}
export interface AuthSliceActions {
    initAuth: () => Promise<void>;
    signUp: (email: string, password: string, promoCode?: string) => Promise<User | null>;
    login: (email: string, password: string) => Promise<User | null>;
    logout: () => void;
    updateUserProfile: (details: { name: string, profile: string }) => void;
    changePassword: (password: string) => void;
    hasQuota: (action: keyof User['usage']) => boolean;
    canExport: () => boolean;
    canCustomizeProfile: () => boolean;
    hasProFeatures: () => boolean;
    initiatePayment: (planId: PlanId) => Promise<void>;
    verifyPayment: (params: { transaction_id: string, tx_ref: string }) => Promise<void>;
}
export type AuthSlice = AuthSliceState & AuthSliceActions;

// Opportunity Slice
export interface OpportunitySliceState {
    opportunitiesById: Record<string, Opportunity>;
    opportunityIds: string[];
    clientSearchQuery: string;
    advancedFilters: AdvancedFilters;
    isAgentSearching: boolean;
    isCoolingDown: boolean;
    agentMission: AgentMission | null;
    agentProgress: ProgressReport | null;
    agentAbortController: AbortController | null;
    isSending: boolean;
    insights: string;
    isGeneratingInsights: boolean;
    isThinking: boolean;
    savedSearches: SavedSearch[];
}
export interface OpportunitySliceActions {
    initOpportunities: () => Promise<void>;
    setClientSearchQuery: (query: string) => void;
    setAdvancedFilters: (filters: Partial<AdvancedFilters>) => void;
    resetAdvancedFilters: () => void;
    saveOpportunity: (newOpportunity: Omit<Opportunity, 'id' | 'Relevance' | 'citations' | 'status' | 'chatHistory' | 'userId' | 'foundAt'>) => void;
    deleteOpportunity: (idToDelete: string) => void;
    updateOpportunity: (updatedOpportunity: Opportunity, persist?: boolean) => void;
    importOpportunities: (file: File) => void;
    importOpportunitiesFromText: (text: string) => Promise<void>;
    clearAllData: () => void;
    dispatchAgent: (params: SearchParams) => void;
    cancelAgent: () => void;
    sendMessage: (opportunity: Opportunity, message: string) => Promise<void>;
    generateInsights: (opportunities: Opportunity[]) => void;
    loadSavedSearches: () => Promise<void>;
    saveSearch: (name: string, params: SearchParams) => Promise<void>;
    deleteSearch: (id: string) => Promise<void>;
    addDiscoveredOpportunities: (discoveredOps: Opportunity[]) => void;
}
export type OpportunitySlice = OpportunitySliceState & OpportunitySliceActions;

export type Theme = 'dark' | 'light' | 'midnight';

// UI Slice
export interface UISliceState {
    sidebarWidth: number;
    lastSearchReport: { message: string } | null;
    isInitiatingPayment: boolean;
    paymentError: string | null;
    theme: Theme;
    activeView: 'table' | 'agents';
    isKeywordBoostEnabled: boolean;
    isExploratorySearchEnabled: boolean;
    newlyAddedOpportunityIds: string[];
    toasts: Toast[];
}
export interface UISliceActions {
    setSidebarWidth: (width: number) => void;
    setLastSearchReport: (report: { message: string } | null) => void;
    setIsInitiatingPayment: (isLoading: boolean) => void;
    setPaymentError: (error: string | null) => void;
    setTheme: (theme: Theme) => void;
    initTheme: () => void;
    setActiveView: (view: 'table' | 'agents') => void;
    setIsKeywordBoostEnabled: (isEnabled: boolean) => void;
    initKeywordBoost: () => void;
    setIsExploratorySearchEnabled: (isEnabled: boolean) => void;
    initExploratorySearch: () => void;
    setNewlyAddedOpportunityIds: (ids: string[]) => void;
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
}
export type UISlice = UISliceState & UISliceActions;

// Root Store Types
export type AppState = AuthSlice & OpportunitySlice & UISlice & AgentSlice;

export interface AppActions {
    init: () => Promise<void>;
    loadUserData: () => Promise<void>;
};

export type RootState = AppState & AppActions;