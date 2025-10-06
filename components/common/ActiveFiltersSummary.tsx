import React, { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore.ts';
import { CloseIcon } from '../icons.tsx';

const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }
    return parsed.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const ActiveFiltersSummary: React.FC = () => {
    const {
        clientSearchQuery,
        advancedFilters,
        setAdvancedFilters,
        resetAdvancedFilters,
        setClientSearchQuery,
    } = useAppStore(state => ({
        clientSearchQuery: state.clientSearchQuery,
        advancedFilters: state.advancedFilters,
        setAdvancedFilters: state.setAdvancedFilters,
        resetAdvancedFilters: state.resetAdvancedFilters,
        setClientSearchQuery: state.setClientSearchQuery,
    }));

    const activeFilters = useMemo(() => {
        const items: { key: string; label: string; onRemove: () => void }[] = [];
        const trimmedQuery = clientSearchQuery.trim();

        if (trimmedQuery) {
            items.push({
                key: 'search',
                label: `Keyword: "${trimmedQuery}"`,
                onRemove: () => setClientSearchQuery(''),
            });
        }

        if (advancedFilters.status.length > 0) {
            advancedFilters.status.forEach((status) => {
                items.push({
                    key: `status-${status}`,
                    label: status,
                    onRemove: () => setAdvancedFilters({
                        status: advancedFilters.status.filter((value) => value !== status),
                    }),
                });
            });
        }

        const [minRelevance, maxRelevance] = advancedFilters.relevance;
        if (minRelevance > 0 || maxRelevance < 100) {
            const parts: string[] = [];
            if (minRelevance > 0) parts.push(`≥ ${minRelevance}`);
            if (maxRelevance < 100) parts.push(`≤ ${maxRelevance}`);
            items.push({
                key: 'relevance',
                label: `Relevance ${parts.join(' & ')}`,
                onRemove: () => setAdvancedFilters({ relevance: [0, 100] }),
            });
        }

        const { start, end } = advancedFilters.deadline;
        const formattedStart = formatDate(start);
        const formattedEnd = formatDate(end);
        if (formattedStart || formattedEnd) {
            items.push({
                key: 'deadline',
                label: `Deadline ${formattedStart ?? 'Any'} → ${formattedEnd ?? 'Any'}`,
                onRemove: () => setAdvancedFilters({ deadline: { start: null, end: null } }),
            });
        }

        return items;
    }, [advancedFilters, clientSearchQuery, setAdvancedFilters, setClientSearchQuery]);

    if (activeFilters.length === 0) {
        return null;
    }

    const clearAll = () => {
        resetAdvancedFilters();
        setClientSearchQuery('');
    };

    return (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border-accent bg-bg-secondary px-3 py-2 text-sm text-text-secondary">
            <span className="font-semibold text-text-primary">Active filters</span>
            {activeFilters.map((filter) => (
                <button
                    key={filter.key}
                    type="button"
                    onClick={filter.onRemove}
                    className="inline-flex items-center space-x-2 rounded-full border border-border-accent bg-bg-primary px-3 py-1 text-xs font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent"
                >
                    <span>{filter.label}</span>
                    <CloseIcon className="h-3.5 w-3.5" />
                </button>
            ))}
            <button
                type="button"
                onClick={clearAll}
                className="ml-auto text-xs font-semibold uppercase tracking-wide text-accent hover:underline"
            >
                Clear all
            </button>
        </div>
    );
};

export default ActiveFiltersSummary;
