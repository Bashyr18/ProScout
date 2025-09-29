import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore.ts';
import { useModal } from '../hooks/useModal.ts';
import { LocationScope, Opportunity, SavedSearch } from '../types.ts';
import { DownloadIcon, SparklesIcon, SearchIcon, PlusIcon, TrashIcon, UploadIcon, BookmarkIcon, RobotIcon, ClipboardPasteIcon } from './icons.tsx';
import { KEYWORD_BOOST } from '../store/opportunitySlice.ts';
import { AGENT_FREQUENCIES } from '../constants.ts';

declare var XLSX: any;

const searchConfig = {
    continents: ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'],
    regions: ['Sub-Saharan Africa', 'West Africa', 'East Africa', 'Southern Africa', 'North Africa', 'Middle East'],
    countries: ['Nigeria', 'Ghana', 'Uganda', 'Mauritius', 'Kenya', 'South Africa', 'Tanzania', 'Ethiopia', 'Senegal'],
};

interface SidebarProps {
    onDispatch?: () => void;
    filteredOpportunities: Opportunity[]; // Now required for insights
    totalOpportunities: number; // Now required for clear data confirmation
}

const Sidebar: React.FC<SidebarProps> = ({ onDispatch, filteredOpportunities, totalOpportunities }) => {
    const store = useAppStore();
    const { openModal } = useModal();
    const { 
        isKeywordBoostEnabled, setIsKeywordBoostEnabled,
        isExploratorySearchEnabled, setIsExploratorySearchEnabled,
        savedSearches, deleteSearch,
        hasProFeatures, 
    } = useAppStore(state => ({
        isKeywordBoostEnabled: state.isKeywordBoostEnabled,
        setIsKeywordBoostEnabled: state.setIsKeywordBoostEnabled,
        isExploratorySearchEnabled: state.isExploratorySearchEnabled,
        setIsExploratorySearchEnabled: state.setIsExploratorySearchEnabled,
        savedSearches: state.savedSearches,
        deleteSearch: state.deleteSearch,
        hasProFeatures: state.hasProFeatures,
    }));
    const [agentQuery, setAgentQuery] = useState('');
    const [locationScope, setLocationScope] = useState<LocationScope>('Region');
    const [locationValue, setLocationValue] = useState('Sub-Saharan Africa');
    const [organizations, setOrganizations] = useState('');
    const [agentFrequency, setAgentFrequency] = useState(AGENT_FREQUENCIES[2].value);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleResize = useCallback((e: MouseEvent) => {
        e.preventDefault();
        store.setSidebarWidth(e.clientX);
    }, [store]);

    const stopResize = useCallback(() => {
        window.removeEventListener('mousemove', handleResize);
        window.removeEventListener('mouseup', stopResize);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, [handleResize]);

    const startResize = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        window.addEventListener('mousemove', handleResize);
        window.addEventListener('mouseup', stopResize);
    }, [handleResize, stopResize]);

    const handleDispatch = () => {
        if (!store.isAuthenticated) {
            openModal('auth');
            return;
        }
        if (!store.hasQuota('agentDispatches')) {
            openModal('pricing');
            return;
        }
        store.dispatchAgent({
            query: agentQuery,
            location: { scope: locationScope, value: locationValue },
            organizations
        });
        if (onDispatch) {
            onDispatch();
        }
    };
    
    const handleGenerateInsights = () => {
        if (!store.isAuthenticated) {
            openModal('auth');
            return;
        }
        if (!store.hasQuota('insightsGenerations')) {
            openModal('pricing');
            return;
        }
        store.generateInsights(filteredOpportunities);
    }
    
    const handleSaveSearch = () => {
        if (!agentQuery.trim()) return;
        openModal('saveSearch', {
            searchParams: {
                query: agentQuery,
                location: { scope: locationScope, value: locationValue },
                organizations
            }
        });
    }
    
    const handleCreatePersistentAgent = () => {
        if (!hasProFeatures()) {
            openModal('pricing');
            return;
        }
        if (!agentQuery.trim()) {
            store.addToast({ type: 'error', message: 'An agent needs a search objective.'});
            return;
        }
        openModal('agent', {
            searchParams: {
                query: agentQuery,
                location: { scope: locationScope, value: locationValue },
                organizations,
            },
            frequency: agentFrequency,
        });
    };

    const handleApplySavedSearch = (search: SavedSearch) => {
        setAgentQuery(search.params.query);
        setLocationScope(search.params.location.scope);
        setLocationValue(search.params.location.value);
        setOrganizations(search.params.organizations);
    };
    
    const handleDeleteSearch = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        openModal('confirmation', {
            title: 'Delete Saved Search',
            message: 'Are you sure you want to delete this saved search?',
            onConfirm: () => deleteSearch(id)
        });
    };

    const handleExport = () => {
        if (!store.isAuthenticated) {
            openModal('auth');
            return;
        }
        if (!store.canExport()) {
            openModal('pricing');
            return;
        }
        const dataToExport = filteredOpportunities.map(({ id, citations, manuallyAdded, chatHistory, ...rest }) => ({...rest, status: rest.status}));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Opportunities");
        XLSX.writeFile(workbook, "proscout_results.xlsx");
    };

    const handleManualAdd = () => {
        if (!store.isAuthenticated) {
            openModal('auth');
            return;
        }
        openModal('manualAdd');
    };
    
    const handleTextImport = () => {
        if (!store.isAuthenticated) {
            openModal('auth');
            return;
        }
        if (!store.hasQuota('insightsGenerations')) {
            openModal('pricing');
            return;
        }
        openModal('textImport');
    };

    const handleImportClick = () => {
        if (!store.isAuthenticated) {
            openModal('auth');
            return;
        }
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            store.importOpportunities(file);
        }
        if(event.target) {
            event.target.value = '';
        }
    };
    
    const handleClearData = () => {
        openModal('confirmation', {
            title: 'Confirm Deletion',
            message: <p>This action is irreversible and will delete all <strong>{totalOpportunities}</strong> opportunities. To confirm, please type <strong>DELETE</strong> in the box below.</p>,
            onConfirm: store.clearAllData,
            confirmationText: 'DELETE'
        });
    };

    const locationOptions = useMemo(() => {
        switch (locationScope) {
            case 'Continent': return searchConfig.continents;
            case 'Region': return searchConfig.regions;
            case 'Country': return searchConfig.countries;
            default: return [];
        }
    }, [locationScope]);

    const handleScopeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newScope = e.target.value as LocationScope;
        setLocationScope(newScope);
        switch (newScope) {
            case 'Global': setLocationValue('Global'); break;
            case 'Continent': setLocationValue(searchConfig.continents[0]); break;
            case 'Region': setLocationValue(searchConfig.regions[0]); break;
            case 'Country': setLocationValue(searchConfig.countries[0]); break;
        }
    };
    
    const getButtonText = () => {
        if (store.isAgentSearching) return 'Agent Searching...';
        if (store.isCoolingDown) return 'Cooling Down...';
        return 'Dispatch Agent';
    };

    const dispatchDisabled = store.isAgentSearching || store.isCoolingDown || !agentQuery.trim();
    const insightsDisabled = store.isGeneratingInsights || filteredOpportunities.length === 0 || !store.hasQuota('insightsGenerations');
    const exportDisabled = filteredOpportunities.length === 0;

    return (
        <aside className="w-full h-full bg-bg-secondary flex flex-shrink-0">
            <div className="flex-grow p-6 overflow-y-auto">
                <div className="space-y-8">
                     <div data-tour="agent-control-panel">
                        <h3 className="text-lg font-semibold mb-3 text-text-primary">Agent Control Panel</h3>
                        <div className="space-y-4 bg-bg-primary p-4 rounded-lg border border-border-accent">
                            <div>
                                <label htmlFor="agentQuery" className="block text-sm font-medium text-text-secondary mb-1">Search Objective</label>
                                <textarea id="agentQuery" value={agentQuery} onChange={(e) => setAgentQuery(e.target.value)} rows={3} placeholder="e.g., Transaction advisory for infrastructure projects" className="w-full bg-bg-secondary border border-border-accent rounded-md py-2 px-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition" />
                            </div>
                            <div className="pt-2 border-t border-border-accent border-opacity-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex-grow pr-4">
                                        <label htmlFor="keyword-boost-toggle" className="font-semibold text-text-primary text-sm cursor-pointer select-none">
                                            Procurement Keyword Boost
                                        </label>
                                        <p className="text-xs text-text-secondary">Adds common procurement terms to your search for more relevant results.</p>
                                    </div>
                                    <button
                                        type="button"
                                        id="keyword-boost-toggle"
                                        role="switch"
                                        aria-checked={isKeywordBoostEnabled}
                                        onClick={() => setIsKeywordBoostEnabled(!isKeywordBoostEnabled)}
                                        className={`${isKeywordBoostEnabled ? 'bg-accent' : 'bg-border-accent'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0`}
                                    >
                                        <span
                                            className={`${isKeywordBoostEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                        />
                                    </button>
                                </div>
                                <details className="mt-2 text-xs">
                                    <summary className="cursor-pointer text-text-secondary hover:text-text-primary select-none">Show boosted keywords</summary>
                                    <p className="mt-1 p-2 bg-bg-secondary border border-border-accent rounded text-text-secondary break-all">
                                        {KEYWORD_BOOST.trim()}
                                    </p>
                                </details>
                            </div>
                            <div className="pt-2 border-t border-border-accent border-opacity-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex-grow pr-4">
                                        <label htmlFor="exploratory-search-toggle" className="font-semibold text-text-primary text-sm cursor-pointer select-none">
                                            Exploratory Search
                                        </label>
                                        <p className="text-xs text-text-secondary">Allows the agent to discover related topics and new sources.</p>
                                    </div>
                                    <button
                                        type="button"
                                        id="exploratory-search-toggle"
                                        role="switch"
                                        aria-checked={isExploratorySearchEnabled}
                                        onClick={() => setIsExploratorySearchEnabled(!isExploratorySearchEnabled)}
                                        className={`${isExploratorySearchEnabled ? 'bg-accent' : 'bg-border-accent'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0`}
                                    >
                                        <span
                                            className={`${isExploratorySearchEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                        />
                                    </button>
                                </div>
                            </div>
                             <div className="grid grid-cols-2 gap-2">
                                 <div>
                                    <label htmlFor="locationScope" className="block text-sm font-medium text-text-secondary mb-1">Scope</label>
                                    <select id="locationScope" value={locationScope} onChange={handleScopeChange} className="w-full bg-bg-secondary border border-border-accent rounded-md py-2 px-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition">
                                        <option value="Global">Global</option>
                                        <option value="Region">Region</option>
                                        <option value="Continent">Continent</option>
                                        <option value="Country">Country</option>
                                    </select>
                                 </div>
                                  <div>
                                    <label htmlFor="locationValue" className="block text-sm font-medium text-text-secondary mb-1">Location</label>
                                    <select id="locationValue" value={locationValue} onChange={(e) => setLocationValue(e.target.value)} disabled={locationScope === 'Global'} className="w-full bg-bg-secondary border border-border-accent rounded-md py-2 px-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition disabled:opacity-50">
                                         {locationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                 </div>
                             </div>
                             <div>
                                <label htmlFor="organizations" className="block text-sm font-medium text-text-secondary mb-1">Focus on Sources</label>
                                <input type="text" id="organizations" value={organizations} onChange={(e) => setOrganizations(e.target.value)} placeholder="e.g., World Bank, AfDB, UNDP" className="w-full bg-bg-secondary border border-border-accent rounded-md py-2 px-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition" />
                            </div>
                            <div>
                                <label htmlFor="agentFrequency" className="block text-sm font-medium text-text-secondary mb-1">Agent Frequency</label>
                                <select
                                    id="agentFrequency"
                                    value={agentFrequency}
                                    onChange={(e) => setAgentFrequency(Number(e.target.value))}
                                    className="w-full bg-bg-secondary border border-border-accent rounded-md py-2 px-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition"
                                    disabled={!hasProFeatures()}
                                >
                                    {AGENT_FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                </select>
                            </div>
                             <button
                                onClick={handleCreatePersistentAgent}
                                disabled={!hasProFeatures()}
                                title={!hasProFeatures() ? 'Persistent Agents is a Pro feature. Upgrade your plan.' : 'Create a persistent agent with these parameters'}
                                className="w-full flex items-center justify-center space-x-2 border-2 border-border-accent hover:bg-border-accent text-text-primary font-bold py-2 px-4 rounded-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <RobotIcon className="w-5 h-5" />
                                <span>Create Persistent Agent</span>
                            </button>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={handleDispatch}
                                    disabled={dispatchDisabled}
                                    title={
                                        !agentQuery.trim()
                                            ? 'A search objective is required to dispatch the agent.'
                                            : !store.isAuthenticated
                                            ? 'Please log in to dispatch an agent'
                                            : !store.hasQuota('agentDispatches')
                                            ? 'Agent dispatch quota reached. Upgrade to Pro.'
                                            : ''
                                    }
                                    className="w-full flex items-center justify-center space-x-2 bg-accent hover:bg-opacity-90 text-accent-text font-bold py-3 px-4 rounded-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                                >
                                    {store.isAgentSearching ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div> : <SearchIcon className="w-6 h-6" />}
                                    <span>{getButtonText()}</span>
                                </button>
                                <button
                                    onClick={handleSaveSearch}
                                    disabled={!agentQuery.trim()}
                                    title="Save current search parameters"
                                    className="p-3 bg-border-accent hover:bg-accent-hover text-text-primary rounded-md transition duration-300 disabled:opacity-50"
                                >
                                    <BookmarkIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {savedSearches.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-3 text-text-primary">Saved Searches</h3>
                            <div className="space-y-2 bg-bg-primary p-3 rounded-lg border border-border-accent">
                                {savedSearches.map(search => (
                                    <div key={search.id} onClick={() => handleApplySavedSearch(search)} className="group flex items-center justify-between p-2 rounded-md hover:bg-bg-secondary cursor-pointer transition-colors">
                                        <span className="font-medium text-sm text-text-primary group-hover:text-accent truncate pr-2">{search.name}</span>
                                        <button onClick={(e) => handleDeleteSearch(e, search.id)} className="text-text-secondary hover:text-danger-fg opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-danger-bg">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div>
                        <h3 className="text-lg font-semibold mb-3 text-text-primary">Manage Data</h3>
                         <div className="space-y-3 bg-bg-primary p-4 rounded-lg border border-border-accent">
                            <button onClick={handleManualAdd} className="w-full flex items-center justify-center space-x-2 bg-border-accent hover:bg-accent-hover text-text-primary font-bold py-2 px-4 rounded-md transition duration-300">
                                <PlusIcon className="w-5 h-5" />
                                <span>Add Opportunity</span>
                            </button>
                            <button 
                                onClick={handleTextImport}
                                disabled={!store.hasQuota('insightsGenerations')}
                                title={!store.isAuthenticated ? 'Please log in' : !store.hasQuota('insightsGenerations') ? 'Text import is a Pro feature and uses AI Insights credits.' : 'Parse opportunities from pasted text using AI'}
                                className="w-full flex items-center justify-center space-x-2 bg-border-accent hover:bg-accent-hover text-text-primary font-bold py-2 px-4 rounded-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                <ClipboardPasteIcon className="w-5 h-5" />
                                <span>Import from Text</span>
                            </button>
                            <button data-tour="ai-insights" onClick={handleGenerateInsights} disabled={insightsDisabled} title={!store.isAuthenticated ? 'Please log in to generate insights' : !store.hasQuota('insightsGenerations') ? 'AI insights is a Pro feature. Upgrade your plan.' : ''} className="w-full flex items-center justify-center space-x-2 border-2 border-border-accent hover:bg-border-accent text-text-primary font-bold py-2 px-4 rounded-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                <SparklesIcon className="w-5 h-5" />
                                <span>{store.isGeneratingInsights ? 'Generating...' : 'Generate AI Insights'}</span>
                            </button>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={handleImportClick} className="w-full flex items-center justify-center space-x-2 border-2 border-border-accent hover:bg-border-accent text-text-primary font-bold py-2 px-4 rounded-md transition duration-300">
                                    <UploadIcon className="w-5 h-5" />
                                    <span>Import</span>
                                </button>
                                <button onClick={handleExport} disabled={exportDisabled} title={!store.isAuthenticated ? 'Please log in to export' : !store.canExport() ? 'Export is a Pro feature.' : ''} className="w-full flex items-center justify-center space-x-2 border-2 border-border-accent hover:bg-border-accent text-text-primary font-bold py-2 px-4 rounded-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <DownloadIcon className="w-5 h-5" />
                                    <span>Export</span>
                                </button>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept=".xlsx, .xls"
                            />
                             <button onClick={handleClearData} disabled={totalOpportunities === 0} className="w-full flex items-center justify-center space-x-2 border-2 border-danger-border hover:bg-danger-bg text-danger-fg font-bold py-2 px-4 rounded-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                <TrashIcon className="w-5 h-5" />
                                <span>Clear All Data</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div 
                onMouseDown={startResize}
                className="w-2 cursor-col-resize hover:bg-accent hover:bg-opacity-50 transition-colors duration-200 flex-shrink-0"
                title="Resize sidebar"
            ></div>
        </aside>
    );
};

export default Sidebar;