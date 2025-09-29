// --- THIS FILE REPRESENTS A SECURE BACKEND SERVER ---
// In a real application, this code would live on a server (e.g., Node.js, Cloud Function).
// The API_KEY is stored securely on the server and is never exposed to the client.
import { GoogleGenAI } from "@google/genai";
import { Opportunity, AgentMission, SearchStreamEvent, RawStreamedOpportunity } from "../types.ts";
import * as geminiService from './geminiService.ts';
import * as db from './db.ts';

// Server-side instance of the AI client
let aiClient: GoogleGenAI | null = null;
const API_KEY = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;

if (API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: API_KEY });
} else {
    console.warn("API_KEY environment variable not set. AI services will be unavailable.");
}

function ensureClient(): GoogleGenAI {
    if (!aiClient) {
        throw new Error("AI client is not initialized on the server. Make sure API_KEY environment variable is set.");
    }
    return aiClient;
}

// --- API Endpoints (Simulated) ---

export async function* runStructuredSearch(
    userId: string,
    mission: AgentMission,
    signal: AbortSignal,
): AsyncGenerator<SearchStreamEvent> {
    const client = ensureClient();
    console.log(`API: User ${userId} requesting structured search stream...`);

    // SERVER-SIDE QUOTA CHECK
    const hasQuota = await db.checkAndDecrementQuota(userId, 'agentDispatches');
    if (!hasQuota) {
        throw new Error("Agent dispatch quota exceeded for this month.");
    }

    const user = await db.getUser(userId);
    const geminiStream = geminiService.runStructuredSearchMission(client, mission, user?.companyProfile, signal);

    for await (const event of geminiStream) {
        if (signal?.aborted) {
            return;
        }
        
        // Pass through all events as they are. The `userId` will be added in the store.
        // This keeps the API layer simple and focused on transport.
        yield event;
    }
}

export async function* generateInsights(userId: string, opportunities: Opportunity[]): AsyncGenerator<string> {
    const client = ensureClient();
    console.log(`API: User ${userId} requesting insights stream...`);
    
    // SERVER-SIDE QUOTA CHECK
    const hasQuota = await db.checkAndDecrementQuota(userId, 'insightsGenerations');
    if (!hasQuota) {
        throw new Error("AI insights quota exceeded for this month.");
    }

    // Yield the result of the Gemini service
    yield* geminiService.generateInsightsStream(client, opportunities);
}

export async function* getChatResponse(
    userId: string,
    url:string,
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    newMessage: string
): AsyncGenerator<string> {
    const client = ensureClient();
    console.log(`API: User ${userId} requesting chat stream...`);
    
    // SERVER-SIDE QUOTA CHECK
    const hasQuota = await db.checkAndDecrementQuota(userId, 'chatMessages');
    if (!hasQuota) {
        throw new Error("AI chat quota exceeded for this month.");
    }
    
    // Yield the result of the Gemini service
    yield* geminiService.getChatResponseStream(client, url, history, newMessage);
}

export async function parseTextImport(userId: string, text: string): Promise<RawStreamedOpportunity[]> {
    const client = ensureClient();
    console.log(`API: User ${userId} requesting text import...`);
    
    // SERVER-SIDE QUOTA CHECK - let's use 'insightsGenerations' quota for this.
    const hasQuota = await db.checkAndDecrementQuota(userId, 'insightsGenerations');
    if (!hasQuota) {
        throw new Error("Text import quota exceeded for this month. This feature uses AI Insights credits.");
    }

    // Call the Gemini service
    return await geminiService.parseTextToOpportunities(client, text);
}