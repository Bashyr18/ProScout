import React from 'react';
import { useAppStore } from '../store/useAppStore.ts';
import { OPPORTUNITY_STATUSES } from '../constants.ts';
import { OpportunityStatus } from '../types.ts';

const AdvancedFiltersPanel: React.FC = () => {
    const { advancedFilters, setAdvancedFilters, resetAdvancedFilters } = useAppStore(state => ({
        advancedFilters: state.advancedFilters,
        setAdvancedFilters: state.setAdvancedFilters,
        resetAdvancedFilters: state.resetAdvancedFilters,
    }));

    const handleStatusChange = (status: OpportunityStatus) => {
        const newStatus = advancedFilters.status.includes(status)
            ? advancedFilters.status.filter(s => s !== status)
            : [...advancedFilters.status, status];
        setAdvancedFilters({ status: newStatus });
    };

    const handleRelevanceChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'min' | 'max') => {
        const value = parseInt(e.target.value, 10);
        const [min, max] = advancedFilters.relevance;
        if (type === 'min' && value <= max) {
            setAdvancedFilters({ relevance: [value, max] });
        } else if (type === 'max' && value >= min) {
            setAdvancedFilters({ relevance: [min, value] });
        }
    };
    
    const handleDeadlineChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
        setAdvancedFilters({
            deadline: {
                ...advancedFilters.deadline,
                [type]: e.target.value || null,
            },
        });
    };

    return (
        <div className="bg-bg-secondary p-4 rounded-lg border border-border-accent mb-4 animate-slide-down">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Status Filter */}
                <div>
                    <h4 className="font-semibold text-text-primary mb-2">Status</h4>
                    <div className="flex flex-wrap gap-2">
                        {OPPORTUNITY_STATUSES.map(status => (
                            <button
                                key={status}
                                onClick={() => handleStatusChange(status)}
                                className={`px-3 py-1 text-xs font-bold rounded-full border transition-all duration-200 ${
                                    advancedFilters.status.includes(status)
                                        ? 'bg-accent text-accent-text border-accent'
                                        : 'bg-bg-primary text-text-secondary border-border-accent hover:border-accent-hover'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Relevance Filter */}
                <div>
                    <h4 className="font-semibold text-text-primary mb-2">Relevance Score</h4>
                     <div className="flex items-center space-x-3 text-sm">
                        <span className="text-text-secondary">{advancedFilters.relevance[0]}</span>
                        <div className="relative w-full h-8 flex items-center">
                            <input
                                type="range"
                                min="0" max="100"
                                value={advancedFilters.relevance[0]}
                                onChange={(e) => handleRelevanceChange(e, 'min')}
                                className="absolute w-full h-1.5 bg-transparent appearance-none pointer-events-none z-10"
                            />
                             <input
                                type="range"
                                min="0" max="100"
                                value={advancedFilters.relevance[1]}
                                onChange={(e) => handleRelevanceChange(e, 'max')}
                                className="absolute w-full h-1.5 bg-transparent appearance-none pointer-events-none z-10"
                            />
                            <div className="absolute w-full h-1.5 bg-border-accent rounded-full">
                                <div
                                    className="absolute h-1.5 bg-accent rounded-full"
                                    style={{
                                        left: `${advancedFilters.relevance[0]}%`,
                                        right: `${100 - advancedFilters.relevance[1]}%`,
                                    }}
                                ></div>
                            </div>
                        </div>
                        <span className="text-text-secondary">{advancedFilters.relevance[1]}</span>
                    </div>
                </div>
                
                {/* Deadline Filter */}
                 <div>
                    <h4 className="font-semibold text-text-primary mb-2">Deadline</h4>
                    <div className="flex items-center space-x-2">
                        <input
                            type="date"
                            value={advancedFilters.deadline.start || ''}
                            onChange={(e) => handleDeadlineChange(e, 'start')}
                            className="w-full bg-bg-primary border border-border-accent rounded-md py-1 px-2 text-text-primary text-sm focus:ring-2 focus:ring-accent focus:outline-none transition"
                        />
                         <span className="text-text-secondary">-</span>
                         <input
                            type="date"
                            value={advancedFilters.deadline.end || ''}
                            onChange={(e) => handleDeadlineChange(e, 'end')}
                             className="w-full bg-bg-primary border border-border-accent rounded-md py-1 px-2 text-text-primary text-sm focus:ring-2 focus:ring-accent focus:outline-none transition"
                        />
                    </div>
                </div>
            </div>
            <div className="text-right mt-4">
                <button onClick={resetAdvancedFilters} className="text-sm font-semibold text-text-secondary hover:text-accent underline">
                    Reset Filters
                </button>
            </div>
        </div>
    );
};

export default AdvancedFiltersPanel;
