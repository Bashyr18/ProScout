import React from 'react';
import { useAppStore } from '../store/useAppStore.ts';
import { useModal } from '../hooks/useModal.ts';
import { HomeIcon, SearchIcon, PlusIcon, RobotIcon } from './icons.tsx';

interface BottomNavProps {
    onOpenSearchPanel: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ onOpenSearchPanel }) => {
    const { 
        isAuthenticated,
        activeView,
        setActiveView,
        hasProFeatures,
    } = useAppStore(state => ({
        isAuthenticated: state.isAuthenticated,
        activeView: state.activeView,
        setActiveView: state.setActiveView,
        hasProFeatures: state.hasProFeatures,
    }));
    const { openModal } = useModal();

    const handleManualAdd = () => {
        if (!isAuthenticated) {
            openModal('auth');
            return;
        }
        openModal('manualAdd');
    };
    
    const handleSetHomeView = () => {
        if (activeView === 'agents') {
            setActiveView('table');
        }
    }
    
    const handleSetAgentsView = () => {
        setActiveView('agents');
    }

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 bg-bg-secondary border-t-2 border-border-accent shadow-lg z-30 animate-slide-in-bottom">
                <div className="flex justify-around items-center h-16">
                    <button onClick={handleSetHomeView} className={`flex flex-col items-center justify-center transition-colors w-full ${activeView !== 'agents' ? 'text-accent' : 'text-text-secondary hover:text-accent'}`}>
                        <HomeIcon className="w-6 h-6" />
                        <span className="text-xs mt-1">Home</span>
                    </button>
                    {hasProFeatures() && (
                         <button onClick={handleSetAgentsView} className={`flex flex-col items-center justify-center transition-colors w-full ${activeView === 'agents' ? 'text-accent' : 'text-text-secondary hover:text-accent'}`}>
                            <RobotIcon className="w-6 h-6" />
                            <span className="text-xs mt-1">Agents</span>
                        </button>
                    )}
                    <button 
                        data-tour="mobile-agent-btn"
                        onClick={onOpenSearchPanel}
                        className="flex flex-col items-center justify-center text-text-secondary hover:text-accent transition-colors w-full"
                    >
                        <SearchIcon className="w-6 h-6" />
                        <span className="text-xs mt-1">Dispatch</span>
                    </button>
                    <button 
                        data-tour="mobile-add-btn"
                        onClick={handleManualAdd}
                        className="flex flex-col items-center justify-center text-text-secondary hover:text-accent transition-colors w-full"
                    >
                        <PlusIcon className="w-6 h-6" />
                        <span className="text-xs mt-1">Add New</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default BottomNav;