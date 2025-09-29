import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore.ts';
import { Agent, LocationScope, SearchParams } from '../../types.ts';
import { useFocusTrap } from '../../hooks/useFocusTrap.ts';
import { CloseIcon, RobotIcon } from '../icons.tsx';
import { AGENT_FREQUENCIES } from '../../constants.ts';

const searchConfig = {
    continents: ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'],
    regions: ['Sub-Saharan Africa', 'West Africa', 'East Africa', 'Southern Africa', 'North Africa', 'Middle East'],
    countries: ['Nigeria', 'Ghana', 'Uganda', 'Mauritius', 'Kenya', 'South Africa', 'Tanzania', 'Ethiopia', 'Senegal'],
};

interface AgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingAgent: Agent | null | undefined;
    searchParamsToSave: SearchParams | null | undefined;
    frequency?: number;
}

const AgentModal: React.FC<AgentModalProps> = ({ isOpen, onClose, editingAgent, searchParamsToSave, frequency: initialFrequency }) => {
    const { 
        createAgent, 
        updateAgent
    } = useAppStore(state => ({
        createAgent: state.createAgent,
        updateAgent: state.updateAgent,
    }));
    
    const [name, setName] = useState('');
    const [searchParams, setSearchParams] = useState<SearchParams>({
        query: '',
        location: { scope: 'Region', value: 'Sub-Saharan Africa' },
        organizations: '',
    });
    const [frequency, setFrequency] = useState(AGENT_FREQUENCIES[2].value);
    
    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef, isOpen);

    useEffect(() => {
        if (isOpen) {
            if (editingAgent) {
                setName(editingAgent.name);
                setSearchParams(editingAgent.searchParams);
                setFrequency(editingAgent.frequency);
            } else if (searchParamsToSave) {
                 setName(searchParamsToSave.query);
                 setSearchParams(searchParamsToSave);
                 if (initialFrequency) {
                    setFrequency(initialFrequency);
                 }
            } else {
                // Reset for new agent
                setName('');
                setSearchParams({ query: '', location: { scope: 'Region', value: 'Sub-Saharan Africa' }, organizations: '' });
                setFrequency(initialFrequency || AGENT_FREQUENCIES[2].value);
            }
        }
    }, [isOpen, editingAgent, searchParamsToSave, initialFrequency]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !searchParams.query.trim()) return;
        
        if (editingAgent) {
            updateAgent(editingAgent.id, { name: name.trim(), searchParams, frequency });
        } else {
            createAgent(name.trim(), searchParams, frequency);
        }
        onClose();
    };
    
    const handleParamChange = (field: keyof SearchParams, value: any) => {
        setSearchParams(prev => ({ ...prev, [field]: value }));
    };
    
    const handleLocationScopeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newScope = e.target.value as LocationScope;
        let newValue = '';
        switch (newScope) {
            case 'Global': newValue = 'Global'; break;
            case 'Continent': newValue = searchConfig.continents[0]; break;
            case 'Region': newValue = searchConfig.regions[0]; break;
            case 'Country': newValue = searchConfig.countries[0]; break;
        }
        handleParamChange('location', { scope: newScope, value: newValue });
    };

    const locationOptions = useMemo(() => {
        switch (searchParams.location.scope) {
            case 'Continent': return searchConfig.continents;
            case 'Region': return searchConfig.regions;
            case 'Country': return searchConfig.countries;
            default: return [];
        }
    }, [searchParams.location.scope]);
    
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-bg-primary bg-opacity-80 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                ref={modalRef}
                className="bg-bg-secondary rounded-lg shadow-xl w-full max-w-lg border-2 border-border-accent flex flex-col animate-slide-in-up"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="agent-modal-title"
            >
                <div className="flex items-center justify-between p-4 border-b border-border-accent">
                    <h2 id="agent-modal-title" className="text-xl font-bold text-text-primary flex items-center">
                        <RobotIcon className="w-5 h-5 mr-2" />
                        {editingAgent ? 'Edit Agent' : 'Create Persistent Agent'}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full text-text-secondary hover:bg-border-accent" aria-label="Close dialog">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="agentName" className="block text-sm font-medium text-text-secondary mb-1">Agent Name</label>
                            <input type="text" id="agentName" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-bg-primary border border-border-accent rounded-md py-2 px-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition" />
                        </div>
                        <div>
                            <label htmlFor="agentQuery" className="block text-sm font-medium text-text-secondary mb-1">Search Objective</label>
                            <textarea id="agentQuery" value={searchParams.query} onChange={(e) => handleParamChange('query', e.target.value)} rows={3} required placeholder="e.g., Transaction advisory for infrastructure projects" className="w-full bg-bg-primary border border-border-accent rounded-md py-2 px-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="locationScope" className="block text-sm font-medium text-text-secondary mb-1">Scope</label>
                                <select id="locationScope" value={searchParams.location.scope} onChange={handleLocationScopeChange} className="w-full bg-bg-primary border border-border-accent rounded-md py-2 px-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition">
                                    <option value="Global">Global</option>
                                    <option value="Region">Region</option>
                                    <option value="Continent">Continent</option>
                                    <option value="Country">Country</option>
                                </select>
                             </div>
                              <div>
                                <label htmlFor="locationValue" className="block text-sm font-medium text-text-secondary mb-1">Location</label>
                                <select id="locationValue" value={searchParams.location.value} onChange={(e) => handleParamChange('location', { ...searchParams.location, value: e.target.value })} disabled={searchParams.location.scope === 'Global'} className="w-full bg-bg-primary border border-border-accent rounded-md py-2 px-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition disabled:opacity-50">
                                     {locationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                             </div>
                         </div>
                         <div>
                            <label htmlFor="organizations" className="block text-sm font-medium text-text-secondary mb-1">Focus on Sources</label>
                            <input type="text" id="organizations" value={searchParams.organizations} onChange={(e) => handleParamChange('organizations', e.target.value)} placeholder="e.g., World Bank, AfDB, UNDP" className="w-full bg-bg-primary border border-border-accent rounded-md py-2 px-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition" />
                        </div>
                        <div>
                            <label htmlFor="frequency" className="block text-sm font-medium text-text-secondary mb-1">Run Frequency</label>
                            <select id="frequency" value={frequency} onChange={(e) => setFrequency(Number(e.target.value))} className="w-full bg-bg-primary border border-border-accent rounded-md py-2 px-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition">
                                {AGENT_FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="p-4 bg-bg-primary rounded-b-lg border-t border-border-accent flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="bg-border-accent hover:bg-accent-hover text-text-primary font-bold py-2 px-4 rounded-md transition duration-300">
                            Cancel
                        </button>
                        <button type="submit" className="bg-accent hover:bg-opacity-90 text-accent-text font-bold py-2 px-4 rounded-md transition duration-300 disabled:opacity-50" disabled={!name.trim() || !searchParams.query.trim()}>
                            {editingAgent ? 'Save Changes' : 'Create Agent'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AgentModal;