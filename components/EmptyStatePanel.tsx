import React from 'react';
import { useAppStore } from '../store/useAppStore.ts';
import { RobotIcon, ArrowLeftIcon, ArrowDownIcon, SparklesIcon } from './icons.tsx';
import { useWindowSize } from '../hooks/useWindowSize.ts';
import { PLAN_QUOTAS } from '../constants.ts';

const EmptyStatePanel: React.FC = () => {
    const { width } = useWindowSize();
    const isMobile = width < 1024; // Corresponds to lg breakpoint

    const { user } = useAppStore(state => ({
        user: state.user,
    }));

    const userName = user?.companyName || user?.email;
    const planId = user?.planId || 'free';
    const usage = user?.usage.agentDispatches || 0;
    const quota = PLAN_QUOTAS[planId].agentDispatches;

    const PlanSpecificInfo: React.FC = () => {
        if (!user) return null;

        if (planId === 'free') {
            const dispatchesLeft = typeof quota === 'number' ? Math.max(0, quota - usage) : 0;
            return (
                <div className="mt-6 text-sm text-info-fg p-3 bg-info-bg/50 rounded-lg border border-info-border max-w-md w-full">
                    You have <span className="font-bold">{dispatchesLeft}</span> agent dispatches remaining this month. Use them to discover your next opportunity.
                </div>
            );
        }

        return (
            <div className="mt-6 text-sm text-accent p-3 bg-accent/10 rounded-lg border border-accent/30 max-w-md w-full flex items-center justify-center space-x-2">
                <SparklesIcon className="w-5 h-5 text-accent"/>
                <span className="font-semibold">Your Pro account is active. Automate your scouting by creating persistent agents.</span>
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center justify-center h-full text-center py-16 text-text-secondary bg-gradient-to-b from-bg-secondary to-bg-primary rounded-lg border border-border-accent my-8 animate-fade-in">
            
            {/* Sonar Icon */}
            <div className="relative flex items-center justify-center w-28 h-28 mb-8">
                <div className="sonar-wave" style={{ animationDelay: '0s' }}></div>
                <div className="sonar-wave" style={{ animationDelay: '1s' }}></div>
                <div className="sonar-wave" style={{ animationDelay: '2s' }}></div>
                <div className="relative bg-bg-primary rounded-full p-5 border-2 border-accent shadow-lg">
                    <RobotIcon className="w-12 h-12 text-accent" />
                </div>
            </div>
            
            <h2 className="text-3xl font-bold text-text-primary">Welcome, {userName || 'Pathfinder'}</h2>
            <p className="mt-2 max-w-md text-lg leading-relaxed">
                Your mission control is clear. It's time to launch your first scouting agent.
            </p>

            <PlanSpecificInfo />

            {/* Call to Action Card */}
            <div 
                className="mt-8 p-6 bg-bg-secondary rounded-lg border-2 border-border-accent shadow-xl w-full max-w-md relative"
                data-tour="agent-control-panel" // For the onboarding tour
            >
                <h3 className="text-xl font-bold text-accent">First Assignment</h3>
                <p className="mt-2 text-base text-text-primary">
                    Use the <strong className="text-accent">Agent Control Panel</strong> to define your search and dispatch your first AI agent.
                </p>
                
                {/* Animated Arrow */}
                {isMobile ? (
                     <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-accent animate-point-down">
                        <ArrowDownIcon className="w-10 h-10" />
                    </div>
                ) : (
                    <div className="absolute -left-14 top-1/2 -translate-y-1/2 text-accent animate-point-left">
                        <ArrowLeftIcon className="w-12 h-12" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmptyStatePanel;