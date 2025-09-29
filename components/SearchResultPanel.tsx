import React from 'react';
import { InformationCircleIcon, CloseIcon } from './icons.tsx';

interface SearchResultPanelProps {
    message: string;
    onDismiss: () => void;
}

const SearchResultPanel: React.FC<SearchResultPanelProps> = ({ message, onDismiss }) => {
    return (
        <div className="bg-bg-secondary rounded-lg shadow-lg p-6 animate-fade-in border border-border-accent my-8 relative">
            <div className="flex flex-col md:flex-row items-center text-center md:text-left">
                <InformationCircleIcon className="w-12 h-12 text-accent mb-4 md:mb-0 md:mr-6 flex-shrink-0" />
                <div>
                    <h2 className="text-xl font-bold text-text-primary mb-1">Search Complete</h2>
                    <p className="text-text-secondary max-w-xl">{message}</p>
                </div>
            </div>
             <button onClick={onDismiss} className="absolute top-2 right-2 p-2 rounded-full text-text-secondary hover:bg-border-accent transition-colors duration-200">
                <CloseIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

export default SearchResultPanel;