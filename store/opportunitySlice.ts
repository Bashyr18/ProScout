import { StateCreator } from 'zustand';
import { produce } from 'immer';
import { Opportunity, SearchParams, AgentMission, OpportunitySlice, RootState, AdvancedFilters, SavedSearch, SearchStreamEvent } from '../types.ts';
import { calculateRelevance } from '../services/dataService.ts';
import * as db from '../services/db.ts';
import * as api from '../services/api.ts';


export const KEYWORD_BOOST = ' "Request for Proposal" "Expression of Interest" "Invitation to Bid" RFP EOI ITB ToR "Terms of Reference" "Procurement Notice"';

const initialAdvancedFilters: AdvancedFilters = {
    status: [],
    relevance: [0, 100],
    deadline: { start: null, end: null },
};

// --- Zustand Store Creation ---
export const createOpportunitySlice: StateCreator<
    RootState,
    [],
    [],
    OpportunitySlice
> = (set, get) => ({
    opportunitiesById: {},
    opportunityIds: [],
    clientSearchQuery: '',
    advancedFilters: initialAdvancedFilters,
    isAgentSearching: false,
    isCoolingDown: false,
    agentMission: null,
    agentProgress: null,
    agentAbortController: null,
    isSending: false,
    insights: '',
    isGeneratingInsights: false,
    isThinking: false,
    savedSearches: [],

    initOpportunities: async () => {
        const user = get().user;
        if (user) {
            const opportunities = await db.getOpportunities(user.id);
            const opportunitiesById: Record<string, Opportunity> = {};
            const opportunityIds: string[] = [];
            
            const sortedOps = opportunities.sort((a, b) => b.Relevance - a.Relevance);

            for (const op of sortedOps) {
                opportunitiesById[op.id] = op;
                opportunityIds.push(op.id);
            }
            set({ opportunitiesById, opportunityIds });
        } else {
            set({ opportunitiesById: {}, opportunityIds: [], clientSearchQuery: '' });
        }
    },

    setClientSearchQuery: (query) => {
        set({ clientSearchQuery: query });
    },
    
    setAdvancedFilters: (filters) => {
        set(produce(state => {
            state.advancedFilters = { ...state.advancedFilters, ...filters };
        }));
    },

    resetAdvancedFilters: () => {
        set({ advancedFilters: initialAdvancedFilters });
    },

    saveOpportunity: async (newOpData) => {
        const user = get().user;
        if (!user) return;

        const newOp: Opportunity = {
            ...newOpData,
            id: crypto.randomUUID(),
            userId: user.id,
            Relevance: calculateRelevance(newOpData),
            manuallyAdded: true,
            status: 'New',
            citations: [],
            chatHistory: [],
            foundAt: Date.now(),
        };
        await db.addOpportunity(newOp);
        set(produce(state => {
            state.opportunitiesById[newOp.id] = newOp;
            state.opportunityIds.unshift(newOp.id);
        }));
    },

    deleteOpportunity: async (id) => {
        await db.deleteOpportunity(id);
        set(produce(state => {
            delete state.opportunitiesById[id];
            state.opportunityIds = state.opportunityIds.filter(opId => opId !== id);
        }));
    },

    updateOpportunity: async (updatedOp, persist = true) => {
        // Optimistic UI update first
        set(produce(state => {
            state.opportunitiesById[updatedOp.id] = updatedOp;
        }));
        // Then persist to DB if required
        if (persist) {
            await db.updateOpportunity(updatedOp);
        }
        const lastMessage = updatedOp.chatHistory?.[updatedOp.chatHistory.length - 1];
        set({ isThinking: get().isSending && lastMessage?.role === 'model' });
    },
    
    importOpportunities: (file) => {
        const { user } = get();
        if (!user) return;

        get().setLastSearchReport({ message: 'Importing and processing file...' });

        const worker = new Worker(new URL('../workers/import.worker.ts', import.meta.url), { type: 'module' });

        worker.onmessage = async (e) => {
            const { success, data, error } = e.data;
            if (success) {
                const importedOps: Opportunity[] = data.map((opData: any) => ({
                    ...opData,
                    id: crypto.randomUUID(),
                    userId: user.id,
                    Relevance: calculateRelevance(opData),
                    foundAt: Date.now(),
                }));
                
                get().addDiscoveredOpportunities(importedOps);
                get().setLastSearchReport({ message: `Import successful. Added ${importedOps.length} opportunities.` });
            } else {
                console.error('Import worker error:', error);
                get().setLastSearchReport({ message: `Import failed: ${error}` });
            }
            worker.terminate();
        };

        worker.onerror = (e) => {
            console.error('Worker failed:', e.message);
            get().setLastSearchReport({ message: `Import failed: ${e.message}` });
            worker.terminate();
        };

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                worker.postMessage({ fileBuffer: event.target.result });
            }
        };
        reader.readAsArrayBuffer(file);
    },
    
    importOpportunitiesFromText: async (text) => {
        const { user } = get();
        if (!user) return;

        get().addToast({ type: 'info', message: 'AI is parsing the text...' });

        try {
            const rawOpportunities = await api.parseTextImport(user.id, text);
            if (rawOpportunities.length === 0) {
                get().addToast({ type: 'info', message: 'The AI could not find any opportunities in the provided text.' });
                return;
            }

            const importedOps: Opportunity[] = rawOpportunities.map((opData: any) => ({
                ...opData,
                id: crypto.randomUUID(),
                userId: user.id,
                Relevance: calculateRelevance(opData),
                status: 'New',
                chatHistory: [],
                citations: opData.noticePageUrl ? [{ title: opData.Source || 'Imported Source', uri: opData.noticePageUrl }] : [],
                foundAt: Date.now(),
            }));
            
            get().addDiscoveredOpportunities(importedOps);
            get().addToast({ type: 'success', message: `Successfully imported ${importedOps.length} opportunities.` });
            await get().initAuth(); // To update usage counts

        } catch (e) {
            const errorMsg = (e as Error).message || "An unknown error occurred.";
            console.error("Text import failed:", e);
            get().addToast({ type: 'error', message: `Import failed: ${errorMsg}`, duration: 7000 });
        }
    },

    clearAllData: async () => {
        const { user } = get();
        if (!user) return;
        await db.clearOpportunities(user.id);
        set({ opportunitiesById: {}, opportunityIds: [] });
    },

    dispatchAgent: async (params) => {
        const { user, isKeywordBoostEnabled, isExploratorySearchEnabled } = get();
        if (!user) return;
        
        const controller = new AbortController();
        
        const isSpecificQuery = params.query.includes('"') || params.query.length > 70;
        const boostedQuery = (isKeywordBoostEnabled && !isSpecificQuery) 
            ? `${params.query}${KEYWORD_BOOST}` 
            : params.query;
        
        const exploratoryInstruction = isExploratorySearchEnabled 
            ? ' The AI is encouraged to find opportunities in related sectors and discover new sources.' 
            : '';

        const profileText = user.companyProfile ? `\n\nMy company profile for prioritization: ${user.companyProfile}` : '';
        const userPrompt = `Search for: "${boostedQuery}" in ${params.location.value}. Focus on sources like: "${params.organizations || 'any'}".${exploratoryInstruction}${profileText}`;
        
        const mission: AgentMission = {
            params,
            systemInstruction: '', // System instruction is now handled by the multi-step agent.
            userPrompt,
        }

        set({
            isAgentSearching: true,
            agentMission: mission,
            agentProgress: { phase: 'searching', message: 'Initializing...', count: 0 },
            lastSearchReport: null,
            agentAbortController: controller,
        });

        let foundCount = 0;
        const newOps: Opportunity[] = [];
        
        try {
            const apiStream = api.runStructuredSearch(user.id, mission, controller.signal);

            for await (const event of apiStream) {
                if (controller.signal.aborted) break;
                
                if (event.type === 'progress') {
                    set(produce(state => {
                        if (state.agentProgress) {
                            state.agentProgress.message = event.data.message;
                            state.agentProgress.count = foundCount;
                        }
                    }));
                    continue;
                }

                const opData = event.data;
                const today = new Date();
                const todayUTCStart = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

                let isExpired = false;
                if (opData.Deadline) {
                    try {
                        const parts = opData.Deadline.split('-').map(Number);
                        const deadlineDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
                        if (deadlineDate.getTime() < todayUTCStart) isExpired = true;
                    } catch (e) {
                         console.warn(`Could not parse deadline "${opData.Deadline}", keeping opportunity.`);
                    }
                }

                if (isExpired) continue;

                const existingURLs = new Set(Object.values(get().opportunitiesById).map(op => (op as Opportunity).noticePageUrl));
                if (existingURLs.has(opData.noticePageUrl)) continue;

                foundCount++;
                const newOp: Opportunity = {
                    ...opData,
                    id: crypto.randomUUID(),
                    userId: user.id,
                    Relevance: calculateRelevance(opData),
                    status: 'New',
                    chatHistory: [],
                    foundAt: Date.now(),
                };
                newOps.push(newOp);
                // Don't update progress here, let the progress event handler do it.
            }

            if (controller.signal.aborted) return;
            
            get().addDiscoveredOpportunities(newOps);
            await get().initAuth(); // To update usage counts
            get().setLastSearchReport({ message: `Search complete. Added ${foundCount} new opportunities.` });

        } catch (e) {
             if (!controller.signal.aborted) {
                console.error(e);
                const errorMessage = (e as Error).message || "An unknown error occurred.";
                 if (errorMessage.includes("quota")) {
                    get().setLastSearchReport({ message: "Agent dispatch quota reached for this month. Please upgrade your plan for more." });
                    get().addToast({ type: 'error', message: 'Agent dispatch quota reached. Upgrade to Pro for more.', duration: 7000 });
                } else {
                    get().setLastSearchReport({ message: `A critical error occurred: ${errorMessage}` });
                }
            }
        } finally {
             if (get().agentAbortController === controller) {
                set({
                    isAgentSearching: false,
                    agentProgress: null,
                    isCoolingDown: true,
                    agentAbortController: null,
                });
                setTimeout(() => set({ isCoolingDown: false }), 5000);
            }
        }
    },
    
    addDiscoveredOpportunities: async (discoveredOps) => {
        if (discoveredOps.length === 0) return;

        await db.addOpportunities(discoveredOps);
        const newIds = discoveredOps.map(op => op.id);
        
        set(produce(state => {
            for (const op of discoveredOps) {
                state.opportunitiesById[op.id] = op;
                state.opportunityIds.unshift(op.id);
            }
            // Sort opportunities by relevance after adding
            state.opportunityIds.sort((a, b) => state.opportunitiesById[b].Relevance - state.opportunitiesById[a].Relevance);
        }));

        get().setNewlyAddedOpportunityIds(newIds);
        setTimeout(() => {
            get().setNewlyAddedOpportunityIds([]);
        }, 7000); // Corresponds to animation duration
    },
    
    cancelAgent: () => {
        get().agentAbortController?.abort(); // Signal the background task to stop

        // Provide immediate UI feedback by updating the state directly
        set({
            isAgentSearching: false,
            agentProgress: null,
            agentMission: null,
            isCoolingDown: true,
            agentAbortController: null, // Clear the controller to prevent race conditions
            lastSearchReport: { message: 'AI Agent mission has been cancelled.' }
        });

        // Set a timeout to end the cooldown period
        setTimeout(() => set({ isCoolingDown: false }), 5000);
    },

    sendMessage: async (opportunity, message) => {
        const { user } = get();
        if (!user) return;

        set({ isSending: true, isThinking: true });
        
        const urlForAnalysis = opportunity.URL || opportunity.noticePageUrl;

        const historyForApi = [...(opportunity.chatHistory || []), { role: 'user' as const, parts: [{ text: message }] }];
        
        let currentOpportunityState = produce(opportunity, draft => {
            draft.chatHistory = [...historyForApi, { role: 'model', parts: [{ text: '' }] }];
        });

        get().updateOpportunity(currentOpportunityState, false);

        try {
            const apiStream = api.getChatResponse(user.id, urlForAnalysis, historyForApi, message);
            let finalResponseText = '';

            for await (const chunk of apiStream) {
                finalResponseText += chunk;
                currentOpportunityState = produce(currentOpportunityState, draft => {
                    const lastMsg = draft.chatHistory?.[draft.chatHistory.length - 1];
                    if (lastMsg?.role === 'model') {
                        lastMsg.parts[0].text = finalResponseText;
                    }
                });
                get().updateOpportunity(currentOpportunityState, false);
            }

            await get().initAuth();

        } catch (e) {
            const errorMsg = (e as Error).message;
            if (errorMsg.includes("quota")) {
                get().addToast({ type: 'error', message: 'AI chat quota reached. Please upgrade.', duration: 7000 });
            }
            currentOpportunityState = produce(currentOpportunityState, draft => {
                const lastMsg = draft.chatHistory?.[draft.chatHistory.length - 1];
                if (lastMsg?.role === 'model') {
                    lastMsg.parts[0].text = `**Error:** I was unable to complete the request. Please try again later. (${errorMsg})`;
                }
            });
            get().updateOpportunity(currentOpportunityState, false);

        } finally {
            await db.updateOpportunity(currentOpportunityState);
            set({ isSending: false, isThinking: false });
        }
    },

    generateInsights: async (opportunities) => {
        const { user } = get();
        if (!user) return;
        if (opportunities.length === 0) return;

        set({ isGeneratingInsights: true, insights: '' });

        try {
            const stream = api.generateInsights(user.id, opportunities);
            
            for await (const chunk of stream) {
                set(produce(state => { state.insights += chunk; }));
            }
            await get().initAuth();

        } catch(e) {
            const errorMsg = (e as Error).message;
             if (errorMsg.includes("quota")) {
                 get().addToast({ type: 'error', message: 'AI insights quota reached. Please upgrade.', duration: 7000 });
            }
            get().setLastSearchReport({ message: `Failed to generate AI insights: ${errorMsg}` });
        } finally {
            set({ isGeneratingInsights: false });
        }
    },
    
    loadSavedSearches: async () => {
        const user = get().user;
        if (user) {
            const searches = await db.getSavedSearches(user.id);
            set({ savedSearches: searches.sort((a, b) => a.name.localeCompare(b.name)) });
        } else {
            set({ savedSearches: [] });
        }
    },

    saveSearch: async (name, params) => {
        const { user } = get();
        if (!user) return;
        const newSearch: SavedSearch = {
            id: crypto.randomUUID(),
            userId: user.id,
            name,
            params,
        };
        await db.addSavedSearch(newSearch);
        await get().loadSavedSearches();
    },

    deleteSearch: async (id) => {
        await db.deleteSavedSearch(id);
        set(produce(state => {
            state.savedSearches = state.savedSearches.filter(s => s.id !== id);
        }));
    },
});