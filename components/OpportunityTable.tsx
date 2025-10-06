import React from 'react';
import { useAppStore } from '../store/useAppStore.ts';
import { Opportunity, OpportunitySortField } from '../types.ts';
import { SearchIcon, ArrowDownIcon } from './icons.tsx';
import OpportunityRow from './common/OpportunityRow.tsx';


interface OpportunityTableProps {
    opportunities: Opportunity[];
}

const SortIndicator: React.FC<{ active: boolean; direction: 'asc' | 'desc' }> = ({ active, direction }) => (
    <ArrowDownIcon
        className={`w-4 h-4 transition-transform duration-200 ${direction === 'asc' ? 'rotate-180' : ''} ${active ? 'opacity-100 text-accent' : 'opacity-0 text-border-accent group-hover:opacity-60'}`}
    />
);

const columns: { field: OpportunitySortField; label: string; align?: 'center' }[] = [
    { field: 'title', label: 'Opportunity' },
    { field: 'location', label: 'Location' },
    { field: 'deadline', label: 'Timeline' },
    { field: 'status', label: 'Status', align: 'center' },
    { field: 'relevance', label: 'Relevance' },
    { field: 'source', label: 'Source', align: 'center' },
];

const TableHeader: React.FC = React.memo(() => {
    const { opportunitySort, setOpportunitySort } = useAppStore(state => ({
        opportunitySort: state.opportunitySort,
        setOpportunitySort: state.setOpportunitySort,
    }));

    return (
        <div className="hidden lg:grid grid-cols-[minmax(0,_3fr)_minmax(0,_1.5fr)_1fr_1fr_1.5fr_1fr] gap-x-6 items-center px-6 py-3 bg-bg-secondary border-b-2 border-border-accent">
            {columns.map(({ field, label, align }) => {
                const isActive = opportunitySort.field === field;
                const alignmentClasses = align === 'center' ? 'justify-center text-center space-x-1.5' : 'justify-start text-left space-x-2';

                return (
                    <button
                        key={field}
                        type="button"
                        onClick={() => setOpportunitySort(field)}
                        className={`group flex items-center ${alignmentClasses} text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${isActive ? 'text-accent' : 'text-text-secondary hover:text-accent'}`}
                    >
                        <span>{label}</span>
                        <SortIndicator active={isActive} direction={opportunitySort.direction} />
                    </button>
                );
            })}
        </div>
    );
});

TableHeader.displayName = 'TableHeader';

const mobileSortOptions: { label: string; field: OpportunitySortField; direction: 'asc' | 'desc' }[] = [
    { label: 'Relevance (High → Low)', field: 'relevance', direction: 'desc' },
    { label: 'Relevance (Low → High)', field: 'relevance', direction: 'asc' },
    { label: 'Deadline (Soonest)', field: 'deadline', direction: 'asc' },
    { label: 'Deadline (Latest)', field: 'deadline', direction: 'desc' },
    { label: 'Status (A → Z)', field: 'status', direction: 'asc' },
    { label: 'Title (A → Z)', field: 'title', direction: 'asc' },
    { label: 'Location (A → Z)', field: 'location', direction: 'asc' },
    { label: 'Source (A → Z)', field: 'source', direction: 'asc' },
];

const MobileSortControl: React.FC = () => {
    const { opportunitySort, setOpportunitySort } = useAppStore(state => ({
        opportunitySort: state.opportunitySort,
        setOpportunitySort: state.setOpportunitySort,
    }));

    const selectedValue = `${opportunitySort.field}:${opportunitySort.direction}`;

    return (
        <div className="lg:hidden flex justify-end px-4 pt-4">
            <label className="flex items-center space-x-2 text-sm text-text-secondary">
                <span className="font-semibold text-text-primary">Sort</span>
                <select
                    value={selectedValue}
                    onChange={(event) => {
                        const [field, direction] = event.target.value.split(':') as [OpportunitySortField, 'asc' | 'desc'];
                        setOpportunitySort(field, direction);
                    }}
                    className="bg-bg-secondary border border-border-accent rounded-md py-1.5 px-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                    aria-label="Change opportunity sort order"
                >
                    {mobileSortOptions.map((option) => (
                        <option key={`${option.field}:${option.direction}`} value={`${option.field}:${option.direction}`}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </label>
        </div>
    );
};

const OpportunityTable: React.FC<OpportunityTableProps> = ({ opportunities }) => {

    return (
        <div className="rounded-lg shadow-lg flex flex-col animate-slide-in-up lg:bg-bg-secondary">
            <TableHeader />
            <MobileSortControl />

            <div className="flex-grow lg:overflow-auto">
                {opportunities.length > 0 ? (
                     <div className="space-y-3 lg:space-y-0">
                        {opportunities.map((op) => (
                           <OpportunityRow key={op.id} opportunity={op} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-16 text-text-secondary bg-bg-secondary rounded-lg">
                        <SearchIcon className="w-12 h-12 text-border-accent" />
                        <p className="mt-4 font-bold text-lg text-text-primary">No matching opportunities found.</p>
                        <p className="mt-1">Try adjusting your filters or dispatch the agent for a new search.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OpportunityTable;