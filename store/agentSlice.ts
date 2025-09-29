
import { StateCreator } from 'zustand';
import { produce } from 'immer';
import { RootState, Agent, SearchParams, AgentSlice, Opportunity, AgentMission, SearchStreamEvent } from '../types.ts';
import * as db from '../services/db.ts';
import * as api from '../services/api.ts';
import { KEYWORD_BOOST } from './opportunitySlice.ts';
import { calculateRelevance } from '../services/dataService.ts';

export const createAgentSlice: StateCreator<
    RootState,
    [],
    [],
    AgentSlice
> = (set, get) => ({
    agentsById: {},
    agentIds: [],

    loadAgents: async () => {
        const { user } = get();
        if (user) {
            const agents = await db.getAgents(user.id);
            const agentsById: Record<string, Agent> = {};
            const agentIds: string[] = [];
            
            const sortedAgents = agents.sort((a, b) => a.createdAt - b.createdAt);

            for (const agent of sortedAgents) {
                agentsById[agent.id] = agent;
                agentIds.push(agent.id);
            }
            set({ agentsById, agentIds });
        } else {
            set({ agentsById: {}, agentIds: [] });
        }
    },

    createAgent: async (name, searchParams, frequency) => {
        const { user } = get();
        if (!user) return;

        const newAgent: Agent = {
            id: crypto.randomUUID(),
            userId: user.id,
            name,
            searchParams,
            frequency,
            createdAt: Date.now(),
            lastRun: null,
            status: 'active',
            lastFoundCount: 0,
        };

        await db.addAgent(newAgent);
        set(produce((state: RootState) => {
            state.agentsById[newAgent.id] = newAgent;
            state.agentIds.push(newAgent.id);
        }));
    },

    updateAgent: async (id, updates) => {
        const agent = get().agentsById[id];
        if (!agent) return;

        const updatedAgent = { ...agent, ...updates };
        await db.updateAgent(updatedAgent);
        set(produce((state: RootState) => {
            state.agentsById[id] = updatedAgent;
        }));
    },
    
    deleteAgent: async (id) => {
        await db.deleteAgent(id);
        set(produce((state: RootState) => {
            delete state.agentsById[id];
            state.agentIds = state.agentIds.filter(agentId => agentId !== id);
        }));
    },

    toggleAgentStatus: async (id) => {
        const agent = get().agentsById[id];
        if (!agent || agent.status === 'running') return;
        
        const newStatus: Agent['status'] = agent.status === 'active' ? 'paused' : 'active';
        const updatedAgent = { ...agent, status: newStatus };
        await db.updateAgent(updatedAgent);
        
        set(produce((state: RootState) => {
            state.agentsById[id]!.status = newStatus;
        }));
    },

    runAgentMission: async (agentId) => {
        const agent = get().agentsById[agentId];
        const user = get().user;
        if (!agent || !user || agent.status === 'running') return;
        
        const originalStatus = agent.status;
        
        const setAgentStatus = (status: Agent['status'], lastFoundCount?: number) => {
            set(produce((state: RootState) => {
                const agentToUpdate = state.agentsById[agentId];
                if (agentToUpdate) {
                    agentToUpdate.status = status;
                    if(lastFoundCount !== undefined) {
                        agentToUpdate.lastFoundCount = lastFoundCount;
                    }
                    if (status !== 'running') {
                        agentToUpdate.lastRun = Date.now();
                    }
                }
            }));
        };

        setAgentStatus('running');

        try {
            const { searchParams } = agent;
            const { isKeywordBoostEnabled, isExploratorySearchEnabled } = get();
            
            const isSpecificQuery = searchParams.query.includes('"') || searchParams.query.length > 70;
            const boostedQuery = (isKeywordBoostEnabled && !isSpecificQuery) 
                ? `${searchParams.query}${KEYWORD_BOOST}` 
                : searchParams.query;
            
            const exploratoryInstruction = isExploratorySearchEnabled 
                ? '\n- Search Mode: **Exploratory**. You are encouraged to find opportunities in related sectors and discover new sources beyond the explicit ones mentioned.' 
                : '';

            const profileText = user.companyProfile ? `\n\nCompany Profile to prioritize:\n---\n${user.companyProfile}\n---` : '';
            const userPrompt = `User Request Details:\n- Search Objective: "${boostedQuery}"\n- Geographic Focus: ${searchParams.location.value} (${searchParams.location.scope})\n- Target Organizations: "${searchParams.organizations || 'Any'}"${exploratoryInstruction}${profileText}`;

            const mission: AgentMission = {
                params: searchParams,
                systemInstruction: '',
                userPrompt,
            };
            
            const apiStream = api.runStructuredSearch(user.id, mission, new AbortController().signal);
            const newOps: Opportunity[] = [];

            for await (const event of apiStream) {
                if (event.type === 'progress') {
                    // Progress events from background agents can be ignored
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
                    } catch (e) {}
                }
                if (isExpired) continue;

                const existingURLs = new Set(Object.values(get().opportunitiesById).map(op => (op as Opportunity).noticePageUrl));
                if (existingURLs.has(opData.noticePageUrl)) continue;

                newOps.push({
                    ...opData,
                    id: crypto.randomUUID(),
                    userId: user.id,
                    Relevance: calculateRelevance(opData),
                    status: 'New',
                    chatHistory: [],
                    foundAt: Date.now(),
                });
            }
            
            if (newOps.length > 0) {
                get().addDiscoveredOpportunities(newOps);
                get().addToast({
                    type: 'success',
                    message: `Agent "${agent.name}" found ${newOps.length} new opportunities!`
                });
            }
            
            const agentForDbUpdate = get().agentsById[agentId];
            if (agentForDbUpdate) {
                await db.updateAgent({ ...agentForDbUpdate, status: originalStatus, lastRun: Date.now(), lastFoundCount: newOps.length });
            }
            setAgentStatus(originalStatus, newOps.length);

        } catch (e) {
            console.error(`Mission failed for agent ${agentId}:`, e);
            get().addToast({ type: 'error', message: `Agent "${agent.name}" failed: ${(e as Error).message}` });
            
            const agentForDbUpdate = get().agentsById[agentId];
            if (agentForDbUpdate) {
                await db.updateAgent({ ...agentForDbUpdate, status: 'error', lastRun: Date.now() });
            }
            setAgentStatus('error');
        }
    },
});