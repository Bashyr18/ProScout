import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore.ts';
import { CloseIcon, BookmarkIcon } from './icons.tsx';
import { useFocusTrap } from '../hooks/useFocusTrap.ts';
import { SearchParams } from '../types.ts';

interface SaveSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    searchParamsToSave: SearchParams | null | undefined;
}

const SaveSearchModal: React.FC<SaveSearchModalProps> = ({ isOpen, onClose, searchParamsToSave }) => {
    const { saveSearch } = useAppStore(state => ({
        saveSearch: state.saveSearch
    }));
    
    const [name, setName] = useState('');
    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef, isOpen);

    useEffect(() => {
        if (isOpen) {
            setName(searchParamsToSave?.query || '');
        }
    }, [isOpen, searchParamsToSave]);

    const handleClose = () => {
        onClose();
        setName('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && searchParamsToSave) {
            saveSearch(name.trim(), searchParamsToSave);
            handleClose();
        }
    };
    
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-bg-primary bg-opacity-80 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={handleClose}
        >
            <div 
                ref={modalRef}
                className="bg-bg-secondary rounded-lg shadow-xl w-full max-w-md border-2 border-border-accent flex flex-col animate-slide-in-up"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="save-search-title"
            >
                <div className="flex items-center justify-between p-4 border-b border-border-accent">
                    <h2 id="save-search-title" className="text-xl font-bold text-text-primary flex items-center">
                        <BookmarkIcon className="w-5 h-5 mr-2" />
                        Save Search
                    </h2>
                    <button onClick={handleClose} className="p-1 rounded-full text-text-secondary hover:bg-border-accent" aria-label="Close dialog">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <label htmlFor="searchName" className="block text-sm font-medium text-text-secondary mb-1">Search Name</label>
                        <input
                            type="text"
                            id="searchName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full bg-bg-primary border border-border-accent rounded-md py-2 px-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition"
                        />
                         <p className="text-xs text-text-secondary mt-2">Save the current search objective, location, and sources for quick access later.</p>
                    </div>
                    <div className="p-4 bg-bg-primary rounded-b-lg border-t border-border-accent flex justify-end space-x-2">
                        <button type="button" onClick={handleClose} className="bg-border-accent hover:bg-accent-hover text-text-primary font-bold py-2 px-4 rounded-md transition duration-300">
                            Cancel
                        </button>
                        <button type="submit" className="bg-accent hover:bg-opacity-90 text-accent-text font-bold py-2 px-4 rounded-md transition duration-300 disabled:opacity-50" disabled={!name.trim()}>
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SaveSearchModal;