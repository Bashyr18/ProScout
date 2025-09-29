import React from 'react';
import { AgentMission, ProgressReport } from '../types.ts';
import { useAppStore } from '../store/useAppStore.ts';
import { SearchIcon, GlobeIcon, BriefcaseIcon, OfficeBuildingIcon } from './icons.tsx';

interface AgentStatusPanelProps {
    mission: AgentMission;
    progress: ProgressReport;
    onCancel: () => void;
}

export default function AgentStatusPanel({ mission, progress, onCancel }: AgentStatusPanelProps) {
    const user = useAppStore(state => state.user);
    const agentName = (user?.companyName && user.companyName.trim() !== '') ? user.companyName : 'ProScout';
    
    return (
        <div className="bg-bg-secondary rounded-lg shadow-lg p-6 md:p-8 flex flex-col items-center justify-center text-center animate-fade-in border border-border-accent my-8">
            <div className="relative flex items-center justify-center w-24 h-24 md:w-32 md:h-32 mb-6">
                <div className="absolute inset-0 opacity-20 rounded-full sonar-ping"></div>
                <div className="absolute inset-0 opacity-30 rounded-full sonar-ping" style={{ animationDelay: '0.5s' }}></div>
                <div className="relative bg-bg-primary rounded-full p-4 border-2 border-accent">
                    <SearchIcon className="w-10 h-10 md:w-12 md:h-12 text-accent" />
                </div>
            </div>
            
            <h2 className="text-2xl font-bold text-text-primary mb-2">AI Agent Dispatched</h2>
            <p className="text-text-secondary mb-6 max-w-lg">
                Your {agentName} agent is actively searching for opportunities. Please wait while it completes its mission.
            </p>

            <div className="w-full max-w-3xl bg-bg-primary p-4 rounded-lg border border-border-accent mb-6">
                <h3 className="text-lg font-semibold text-text-primary mb-3 text-left">Mission Parameters</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                    <div className="flex items-start space-x-3">
                        <BriefcaseIcon className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                        <div>
                            <p className="text-xs font-bold text-text-secondary uppercase">Objective</p>
                            <p className="text-text-primary text-sm">{mission.params.query}</p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <GlobeIcon className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                        <div>
                            <p className="text-xs font-bold text-text-secondary uppercase">Location</p>
                            <p className="text-text-primary text-sm">{mission.params.location.value}</p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <OfficeBuildingIcon className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                        <div>
                            <p className="text-xs font-bold text-text-secondary uppercase">Sources</p>
                            <p className="text-text-primary text-sm">{mission.params.organizations || 'Any'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-2xl mb-4" aria-live="polite" aria-atomic="true">
                 <div className="flex items-center justify-center space-x-3 text-accent">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent"></div>
                    <p className="text-lg font-medium">
                        {progress.message}
                        {(progress.count !== undefined && progress.count > 0) && ` (${progress.count} found)`}
                    </p>
                </div>
            </div>

            <button
                onClick={onCancel}
                className="bg-danger-bg hover:bg-danger-border text-danger-fg font-bold py-2 px-6 rounded-md transition duration-300"
            >
                Cancel Mission
            </button>
        </div>
    );
}