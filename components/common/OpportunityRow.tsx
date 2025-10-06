import React from 'react';
import { Opportunity } from '../../types.ts';
import StatusBadge from './StatusBadge.tsx';
import { calculateDaysLeft } from '../../utils/date.ts';
import { useAppStore } from '../../store/useAppStore.ts';
import { useModal } from '../../hooks/useModal.ts';
import { ExternalLinkIcon, LocationMarkerIcon } from '../icons.tsx';

const RelevanceIndicator: React.FC<{ score: number }> = React.memo(({ score }) => {
    const width = Math.min(100, Math.max(0, score));
    let bgColor = 'bg-danger-fg';
    if (score > 30) bgColor = 'bg-warning-fg';
    if (score > 60) bgColor = 'bg-success-fg';
    if (score > 80) bgColor = 'bg-accent';

    return (
        <div className="flex items-center space-x-2 w-full">
            <span className="text-sm font-bold w-8 text-right flex-shrink-0 text-text-primary">{score}</span>
            <div className="w-full bg-border-accent rounded-full h-1.5">
                <div className={`${bgColor} h-1.5 rounded-full`} style={{ width: `${width}%` }}></div>
            </div>
        </div>
    );
});

interface OpportunityRowProps {
    opportunity: Opportunity;
    showDivider?: boolean;
    className?: string;
}

const OpportunityRow: React.FC<OpportunityRowProps> = ({ opportunity, showDivider = true, className = '' }) => {
    const { newlyAddedOpportunityIds } = useAppStore(state => ({
        newlyAddedOpportunityIds: state.newlyAddedOpportunityIds,
    }));
    const { openModal } = useModal();
    const daysLeft = calculateDaysLeft(opportunity.Deadline);
    const isNew = newlyAddedOpportunityIds.includes(opportunity.id);

    const isValidDocUrl = opportunity.URL && opportunity.URL.startsWith('http');
    const isValidNoticeUrl = opportunity.noticePageUrl && opportunity.noticePageUrl.startsWith('http');

    const LinkSection: React.FC = () => (
         <div onClick={(e) => e.stopPropagation()} className="inline-flex items-center space-x-2 text-sm font-medium">
            {isValidDocUrl ? (
                <a href={opportunity.URL!} target="_blank" rel="noopener noreferrer" className="text-accent hover:opacity-80 transition-colors duration-200 inline-flex items-center space-x-1" title="View the original document (PDF, etc.)">
                    <span>View Doc</span>
                    <ExternalLinkIcon className="w-4 h-4" />
                </a>
            ) : (
                <span className="text-text-secondary inline-flex items-center space-x-1" title="No direct document link found by AI">
                    <span>No Doc</span>
                </span>
            )}
            {isValidNoticeUrl && (
                <>
                    <span className="text-text-secondary font-light text-xs">|</span>
                    <a href={opportunity.noticePageUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:opacity-80 transition-colors" title={`Go to the tender notice page on ${opportunity.Source}`}>
                        View Notice
                    </a>
                </>
            )}
        </div>
    );

    const rowClasses = [
        className,
        'bg-bg-secondary',
        'rounded-lg',
        'shadow-md',
        'p-4',
        'animate-fade-in',
        'border',
        'border-border-accent',
        'hover:border-accent',
        'transition-colors',
        'duration-200',
        'cursor-pointer',
        'lg:border-x-0',
        'lg:border-t-0',
        'lg:rounded-none',
        'lg:p-0',
        'lg:bg-transparent',
        'lg:hover:bg-border-accent',
    ];

    if (showDivider) {
        rowClasses.push('lg:border-b');
    } else {
        rowClasses.push('lg:border-b-0');
    }

    if (isNew) {
        rowClasses.push('glow-fade-out');
    }

    return (
        <div
            onClick={() => openModal('opportunityDetail', { opportunity })}
            className={rowClasses.filter(Boolean).join(' ')}
        >
             {/* --- Desktop Layout --- */}
            <div className="hidden lg:grid grid-cols-[minmax(0,_3fr)_minmax(0,_1.5fr)_1fr_1fr_1.5fr_1fr] gap-x-6 items-center px-6 py-4">
                <div>
                    <h3 className="font-semibold text-sm text-text-primary group-hover:text-accent break-words truncate" title={opportunity.Title}>{opportunity.Title}</h3>
                    <p className="text-xs text-text-secondary mt-1 truncate">{opportunity.Organization}</p>
                </div>
                <div className="text-sm text-text-secondary truncate" title={opportunity.Location}>
                    {opportunity.Location}
                </div>
                <div className="text-sm">
                    <div className={`font-bold ${daysLeft.style}`}>{daysLeft.text}</div>
                </div>
                <div className="justify-self-center">
                    <StatusBadge status={opportunity.status} className="py-0.5"/>
                </div>
                <div>
                    <RelevanceIndicator score={opportunity.Relevance} />
                </div>
                <div className="justify-self-center">
                    <LinkSection />
                </div>
            </div>

            {/* --- Mobile Card Layout --- */}
            <div className="lg:hidden flex flex-col space-y-4">
                 <div className="flex-1 min-w-0">
                     <h3 className="font-bold text-base text-text-primary break-words">{opportunity.Title}</h3>
                     <p className="text-sm text-text-secondary mt-1 truncate">{opportunity.Organization}</p>
                </div>

                <div>
                    <RelevanceIndicator score={opportunity.Relevance} />
                </div>
                
                <div className="text-sm text-text-secondary border-t border-border-accent pt-3 mt-2 space-y-3">
                     <div className="flex justify-between items-center">
                        <span className="font-semibold">Status</span>
                        <StatusBadge status={opportunity.status} />
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="font-semibold">Location</span>
                         <span className="truncate font-medium text-text-primary flex items-center space-x-1.5">
                             <LocationMarkerIcon className="w-4 h-4 flex-shrink-0" />
                             <span>{opportunity.Location}</span>
                         </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-semibold">Deadline</span>
                        <div className={`font-bold ${daysLeft.style}`}>{daysLeft.text}</div>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="font-semibold">Links</span>
                        <LinkSection />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OpportunityRow;