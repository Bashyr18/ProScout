// Using `as const` creates a readonly tuple, which allows us to derive a union type from it.
export const PLAN_IDS = ['free', 'pro', 'lifetime'] as const;

export const OPPORTUNITY_STATUSES = ['New', 'Reviewing', 'Action', 'Discarded'] as const;

export const AGENT_STATUSES = ['active', 'paused', 'running', 'error'] as const;

export const AGENT_FREQUENCIES = [
    { label: 'Every 6 hours', value: 6 * 60 * 60 * 1000 },
    { label: 'Every 12 hours', value: 12 * 60 * 60 * 1000 },
    { label: 'Every 24 hours', value: 24 * 60 * 60 * 1000 },
    { label: 'Every 3 days', value: 3 * 24 * 60 * 60 * 1000 },
    { label: 'Once a week', value: 7 * 24 * 60 * 60 * 1000 },
];

// Centralized quota definitions
export const PLAN_QUOTAS: Record<typeof PLAN_IDS[number], { agentDispatches: number | 'unlimited', insightsGenerations: number | 'unlimited', chatMessages: number | 'unlimited' }> = {
    free: { agentDispatches: 4, insightsGenerations: 0, chatMessages: 15 },
    pro: { agentDispatches: 50, insightsGenerations: 100, chatMessages: 'unlimited' },
    lifetime: { agentDispatches: 'unlimited', insightsGenerations: 'unlimited', chatMessages: 'unlimited'}
};