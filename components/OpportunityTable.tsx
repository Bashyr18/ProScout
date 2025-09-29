import React from 'react';
import { useAppStore } from '../store/useAppStore.ts';
import { Opportunity } from '../types.ts';
import { SearchIcon } from './icons.tsx';
import OpportunityRow from './common/OpportunityRow.tsx';


interface OpportunityTableProps {
    opportunities: Opportunity[];
}

const TableHeader: React.FC = React.memo(() => (
    <div className="hidden lg:grid grid-cols-[minmax(0,_3fr)_minmax(0,_1.5fr)_1fr_1fr_1.5fr_1fr] gap-x-6 items-center px-6 py-3 bg-bg-secondary border-b-2 border-border-accent">
        <div className="text-xs font-medium text-text-secondary uppercase tracking-wider">Opportunity</div>
        <div className="text-xs font-medium text-text-secondary uppercase tracking-wider">Location</div>
        <div className="text-xs font-medium text-text-secondary uppercase tracking-wider">Timeline</div>
        <div className="text-xs font-medium text-text-secondary uppercase tracking-wider text-center">Status</div>
        <div className="text-xs font-medium text-text-secondary uppercase tracking-wider">Relevance</div>
        <div className="text-xs font-medium text-text-secondary uppercase tracking-wider text-center">Source</div>
    </div>
));

const OpportunityTable: React.FC<OpportunityTableProps> = ({ opportunities }) => {

    return (
        <div className="rounded-lg shadow-lg flex flex-col animate-slide-in-up lg:bg-bg-secondary">
            <TableHeader />
            
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