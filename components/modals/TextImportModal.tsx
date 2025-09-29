import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore.ts';
import { useFocusTrap } from '../../hooks/useFocusTrap.ts';
import { CloseIcon, SparklesIcon } from '../icons.tsx';

interface TextImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TextImportModal: React.FC<TextImportModalProps> = ({ isOpen, onClose }) => {
    const { importOpportunitiesFromText } = useAppStore(state => ({
        importOpportunitiesFromText: state.importOpportunitiesFromText,
    }));
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef, isOpen);

    useEffect(() => {
        if (!isOpen) {
            setText('');
            setIsLoading(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || isLoading) return;

        setIsLoading(true);
        try {
            await importOpportunitiesFromText(text);
            onClose();
        } catch (error) {
            // Error is handled by a toast in the slice, but we should stop loading here.
            setIsLoading(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-bg-primary bg-opacity-80 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                ref={modalRef}
                className="bg-bg-secondary rounded-lg shadow-xl w-full max-w-2xl border-2 border-border-accent flex flex-col animate-slide-in-up"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="text-import-title"
            >
                <div className="flex items-center justify-between p-4 border-b border-border-accent">
                    <h2 id="text-import-title" className="text-xl font-bold text-text-primary flex items-center">
                        <SparklesIcon className="w-5 h-5 mr-2 text-accent" />
                        Import Opportunities from Text
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full text-text-secondary hover:bg-border-accent" aria-label="Close dialog">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
                    <div className="p-6 flex-grow">
                        <label htmlFor="text-import-area" className="block text-sm font-medium text-text-secondary mb-1">Paste your text below</label>
                        <p className="text-xs text-text-secondary mb-3">You can paste a markdown table, a list, or even unstructured text. The AI will do its best to parse it.</p>
                        <textarea
                            id="text-import-area"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            required
                            placeholder="e.g., | Country | Project / Assignment | Deadline | ... |"
                            className="w-full h-64 bg-bg-primary border border-border-accent rounded-md py-2 px-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition"
                        />
                    </div>
                    <div className="p-4 bg-bg-primary rounded-b-lg border-t border-border-accent flex justify-end space-x-2 flex-shrink-0">
                        <button type="button" onClick={onClose} className="bg-border-accent hover:bg-accent-hover text-text-primary font-bold py-2 px-4 rounded-md transition duration-300">
                            Cancel
                        </button>
                        <button type="submit" className="bg-accent hover:bg-opacity-90 text-accent-text font-bold py-2 px-4 rounded-md transition duration-300 disabled:opacity-50 flex items-center space-x-2" disabled={!text.trim() || isLoading}>
                             {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div> : <SparklesIcon className="w-5 h-5" />}
                            <span>{isLoading ? 'Parsing...' : 'Import with AI'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TextImportModal;
