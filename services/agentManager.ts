import { RootState } from '../types.ts';

let intervalId: number | null = null;
let storeRef: (() => RootState) | null = null;

const TICK_INTERVAL = 60 * 1000; // 1 minute

function tick() {
    if (!storeRef) return;
    const store = storeRef();
    const { agentsById, agentIds, runAgentMission } = store;

    const now = Date.now();
    
    agentIds.forEach(id => {
        const agent = agentsById[id];
        if (agent.status === 'active') {
            const timeSinceLastRun = agent.lastRun ? now - agent.lastRun : Infinity;
            if (timeSinceLastRun >= agent.frequency) {
                console.log(`Agent "${agent.name}" is due for a run. Dispatching...`);
                runAgentMission(agent.id);
            }
        }
    });
}

export function start(getStore: () => RootState) {
    if (intervalId !== null) {
        console.warn("Agent manager is already running.");
        return;
    }
    console.log("Starting persistent agent manager...");
    storeRef = getStore;
    // Don't tick immediately on start to avoid race conditions with app loading.
    // The first check will happen after the first interval.
    intervalId = window.setInterval(tick, TICK_INTERVAL);
}

export function stop() {
    if (intervalId !== null) {
        console.log("Stopping persistent agent manager.");
        window.clearInterval(intervalId);
        intervalId = null;
        storeRef = null;
    }
}
