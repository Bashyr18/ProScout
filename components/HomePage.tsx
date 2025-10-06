import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore.ts';
import { OPPORTUNITY_STATUSES } from '../constants.ts';

import Header from './Header.tsx';
import Sidebar from './Sidebar.tsx';
import OpportunityTable from './OpportunityTable.tsx';
import InsightsPanel from './InsightsPanel.tsx';
import AgentStatusPanel from './AgentStatusPanel.tsx';
import WelcomePanel from './WelcomePanel.tsx';
import BottomNav from './BottomNav.tsx';
import SearchResultPanel from './SearchResultPanel.tsx';
import PaymentVerificationPage from './PaymentVerificationPage.tsx';
import OnboardingTour from './OnboardingTour.tsx';
import AdvancedFiltersPanel from './AdvancedFiltersPanel.tsx';
import AgentPanel from './AgentPanel.tsx';
import ToastContainer from './ToastContainer.tsx';
import { TableCellsIcon, TuneIcon, RobotIcon, CloseIcon, SearchIcon } from './icons.tsx';
import EmptyStatePanel from './EmptyStatePanel.tsx';
import ActiveFiltersSummary from './common/ActiveFiltersSummary.tsx';

const HomePage: React.FC = () => {
    const [isMobileSearchPanelOpen, setIsMobileSearchPanelOpen] = useState(false);
    const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
    const [shouldStartTour, setShouldStartTour] = useState(false);
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const store = useAppStore();

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        if (queryParams.has('status') && queryParams.has('tx_ref') && queryParams.has('transaction_id')) {
            setIsVerifyingPayment(true);
        }
    }, []);

    // --- DERIVED STATE USING MEMOIZATION FOR PERFORMANCE ---
    const allOpportunities = useMemo(() => {
        return store.opportunityIds.map(id => store.opportunitiesById[id]);
    }, [store.opportunityIds, store.opportunitiesById]);
    
    const filteredOpportunities = useMemo(() => {
        const lowerCaseQuery = store.clientSearchQuery.toLowerCase();
        const { status, relevance, deadline } = store.advancedFilters;

        return allOpportunities.filter(op => {
            // Keyword search
            const keywordMatch = !lowerCaseQuery || (
                (op.Title || '').toLowerCase().includes(lowerCaseQuery) ||
                (op.Organization || '').toLowerCase().includes(lowerCaseQuery) ||
                (op.Location || '').toLowerCase().includes(lowerCaseQuery)
            );
            if (!keywordMatch) return false;

            // Advanced Filters
            const statusMatch = status.length === 0 || status.includes(op.status);
            if (!statusMatch) return false;

            const relevanceMatch = op.Relevance >= relevance[0] && op.Relevance <= relevance[1];
            if (!relevanceMatch) return false;

            if (op.Deadline) {
                try {
                    const deadlineDate = new Date(op.Deadline);
                    if(isNaN(deadlineDate.getTime())) {
                        if(deadline.start || deadline.end) return false;
                    } else {
                        if (deadline.start && deadlineDate < new Date(deadline.start)) return false;
                        if (deadline.end && deadlineDate > new Date(deadline.end)) return false;
                    }
                } catch {
                     if(deadline.start || deadline.end) return false;
                }
            } else {
                 if(deadline.start || deadline.end) return false;
            }

            return true;
        });
    }, [allOpportunities, store.clientSearchQuery, store.advancedFilters]);

    const sortedOpportunities = useMemo(() => {
        const { field, direction } = store.opportunitySort;
        const sorted = [...filteredOpportunities];
        const multiplier = direction === 'asc' ? 1 : -1;

        const compareText = (a?: string | null, b?: string | null) => {
            const normalizedA = (a || '').toLowerCase();
            const normalizedB = (b || '').toLowerCase();
            if (normalizedA === normalizedB) return 0;
            return normalizedA < normalizedB ? -1 : 1;
        };

        const getStatusRank = (status: string) => {
            const index = OPPORTUNITY_STATUSES.indexOf(status as (typeof OPPORTUNITY_STATUSES)[number]);
            return index === -1 ? OPPORTUNITY_STATUSES.length : index;
        };

        const parseDeadline = (deadline: string | null) => {
            if (!deadline) return null;
            const timestamp = new Date(deadline).getTime();
            return Number.isNaN(timestamp) ? null : timestamp;
        };

        sorted.sort((a, b) => {
            let comparison = 0;

            switch (field) {
                case 'title':
                    comparison = compareText(a.Title, b.Title);
                    break;
                case 'organization':
                    comparison = compareText(a.Organization, b.Organization);
                    break;
                case 'location':
                    comparison = compareText(a.Location, b.Location);
                    break;
                case 'source':
                    comparison = compareText(a.Source, b.Source);
                    break;
                case 'status':
                    comparison = getStatusRank(a.status) - getStatusRank(b.status);
                    break;
                case 'deadline': {
                    const aDeadline = parseDeadline(a.Deadline);
                    const bDeadline = parseDeadline(b.Deadline);

                    if (aDeadline === null && bDeadline === null) {
                        comparison = 0;
                    } else if (aDeadline === null) {
                        comparison = 1;
                    } else if (bDeadline === null) {
                        comparison = -1;
                    } else {
                        comparison = aDeadline - bDeadline;
                    }
                    break;
                }
                case 'relevance':
                default:
                    comparison = a.Relevance - b.Relevance;
                    break;
            }

            if (comparison === 0) {
                return b.foundAt - a.foundAt;
            }

            return comparison * multiplier;
        });

        return sorted;
    }, [filteredOpportunities, store.opportunitySort]);

    const totalOpportunities = useMemo(() => allOpportunities.length, [allOpportunities]);

    // --- END OF DERIVED STATE ---

    useEffect(() => {
        const tourCompleted = localStorage.getItem('proscout-tour-completed');
        if (store.isAuthenticated && totalOpportunities === 0 && !store.isAgentSearching) {
            const timer = setTimeout(() => setShouldStartTour(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [store.isAuthenticated, totalOpportunities, store.isAgentSearching]);
    
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (store.clientSearchQuery.trim()) count += 1;
        if (store.advancedFilters.status.length > 0) count += store.advancedFilters.status.length;
        const [minRelevance, maxRelevance] = store.advancedFilters.relevance;
        if (minRelevance > 0 || maxRelevance < 100) count += 1;
        if (store.advancedFilters.deadline.start || store.advancedFilters.deadline.end) count += 1;
        return count;
    }, [store.clientSearchQuery, store.advancedFilters]);

    const ViewToggle = () => (
         <div className="flex items-center bg-bg-primary p-1 rounded-full border border-border-accent shadow-sm">
            <button
                onClick={() => store.setActiveView('table')}
                aria-pressed={store.activeView === 'table'}
                className={`flex items-center space-x-2 text-sm font-semibold px-4 py-1.5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${store.activeView === 'table' ? 'bg-accent text-accent-text shadow-sm' : 'text-text-secondary hover:bg-border-accent'}`}
            >
                <TableCellsIcon className="w-5 h-5" />
                <span>Table</span>
            </button>
             {store.hasProFeatures() && (
                <button
                    onClick={() => store.setActiveView('agents')}
                    aria-pressed={store.activeView === 'agents'}
                    className={`flex items-center space-x-2 text-sm font-semibold px-4 py-1.5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${store.activeView === 'agents' ? 'bg-accent text-accent-text shadow-sm' : 'text-text-secondary hover:bg-border-accent'}`}
                >
                    <RobotIcon className="w-5 h-5" />
                    <span>Agents</span>
                </button>
            )}
        </div>
    );

    const mainContent = (
        <>
            {isVerifyingPayment ? (
                <PaymentVerificationPage />
            ) : !store.isAuthenticated ? (
                <WelcomePanel />
            ) : (
                // AUTHENTICATED USER VIEW
                <>
                    {/* Top-level banner for search results */}
                    {store.lastSearchReport && !store.isAgentSearching && (
                         <SearchResultPanel
                            message={store.lastSearchReport.message}
                            onDismiss={() => store.setLastSearchReport(null)}
                        />
                    )}

                    {/* Agent searching takes over the main content area */}
                    {store.isAgentSearching && store.agentMission && store.agentProgress ? (
                        <AgentStatusPanel mission={store.agentMission} progress={store.agentProgress} onCancel={store.cancelAgent} />
                    ) : (
                        // Normal dashboard view when not searching
                        <>
                            <InsightsPanel insights={store.insights} isLoading={store.isGeneratingInsights} />
                            
                            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-4" data-tour="filter-bar">
                                <div className="relative flex-1">
                                    <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
                                    <input
                                        type="text"
                                        value={store.clientSearchQuery}
                                        onChange={(e) => store.setClientSearchQuery(e.target.value)}
                                        placeholder="Filter results by keyword..."
                                        className="w-full bg-bg-primary border border-border-accent rounded-md py-2 pl-10 pr-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={totalOpportunities === 0 && store.activeView !== 'agents'}
                                        aria-label="Filter opportunities by keyword"
                                    />
                                </div>
                                 <div className="flex items-center justify-between mt-3 md:mt-0 space-x-2">
                                    <button
                                        onClick={() => setIsFilterPanelOpen(prev => !prev)}
                                        disabled={totalOpportunities === 0}
                                        className="flex-shrink-0 flex items-center space-x-2 bg-border-accent hover:bg-accent-hover text-text-primary font-semibold py-2 px-4 rounded-md transition duration-300 disabled:opacity-50"
                                        aria-expanded={isFilterPanelOpen}
                                    >
                                        <TuneIcon className="w-5 h-5" />
                                        <span className="flex items-center space-x-2">
                                            <span>Filters</span>
                                            {activeFiltersCount > 0 && (
                                                <span className="inline-flex items-center justify-center rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-text">
                                                    {activeFiltersCount}
                                                </span>
                                            )}
                                        </span>
                                    </button>
                                     {(totalOpportunities > 0 || store.activeView === 'agents') && <ViewToggle />}
                                </div>
                            </div>

                            <div className="mb-3 flex flex-col gap-3">
                                <div className="flex flex-wrap items-center justify-between text-xs font-medium text-text-secondary uppercase tracking-wide">
                                    <span>
                                        Showing <span className="text-text-primary">{sortedOpportunities.length}</span> {sortedOpportunities.length === 1 ? 'opportunity' : 'opportunities'}
                                    </span>
                                    {store.isAgentSearching ? (
                                        <span className="text-accent">Agent is scouting…</span>
                                    ) : (
                                        <span>Last updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    )}
                                </div>
                                <ActiveFiltersSummary />
                            </div>

                            {isFilterPanelOpen && totalOpportunities > 0 && <AdvancedFiltersPanel />}

                            {store.activeView === 'agents' ? (
                                <AgentPanel />
                            ) : (
                                totalOpportunities > 0
                                    ? <OpportunityTable opportunities={sortedOpportunities} />
                                    : <EmptyStatePanel />
                            )}
                        </>
                    )}
                </>
            )}
        </>
    );

    return (
        <div className="min-h-screen flex flex-col bg-bg-primary">
            <Header />
            <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
                <div className="hidden lg:flex" style={{ width: store.sidebarWidth }}>
                    <Sidebar
                        filteredOpportunities={sortedOpportunities}
                        totalOpportunities={totalOpportunities}
                    />
                </div>
                
                <main className={`flex-1 overflow-y-auto pb-24 lg:pb-8 ${!store.isAuthenticated ? 'p-0' : 'p-4 md:p-6 lg:p-8'}`}>
                    {mainContent}
                </main>
            </div>
            
            <div className="lg:hidden">
                <BottomNav onOpenSearchPanel={() => setIsMobileSearchPanelOpen(true)} />
            </div>

            {/* Mobile Search Panel (modal-like slide-up) */}
            {isMobileSearchPanelOpen && (
                 <div 
                    className="fixed inset-0 bg-bg-primary bg-opacity-80 z-40 animate-fade-in lg:hidden"
                    onClick={() => setIsMobileSearchPanelOpen(false)}
                >
                    <div 
                        className="absolute inset-0 bg-bg-secondary shadow-xl flex flex-col animate-slide-in-bottom overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-border-accent flex-shrink-0 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-text-primary">Dispatch Agent</h2>
                             <button onClick={() => setIsMobileSearchPanelOpen(false)} className="p-1 rounded-full text-text-secondary hover:bg-border-accent">
                                <CloseIcon className="w-6 h-6"/>
                            </button>
                        </div>
                        <div className="flex-grow overflow-y-auto">
                            <Sidebar
                                onDispatch={() => setIsMobileSearchPanelOpen(false)}
                                filteredOpportunities={sortedOpportunities}
                                totalOpportunities={totalOpportunities}
                            />
                        </div>
                    </div>
                </div>
            )}
            
            <ToastContainer />
            <OnboardingTour start={shouldStartTour} />
        </div>
    );
};

export default HomePage;