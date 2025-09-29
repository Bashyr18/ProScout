import React, { useEffect, useRef, useState } from 'react';
import { CloseIcon, TrashIcon } from './icons.tsx';
import { useFocusTrap } from '../hooks/useFocusTrap.ts';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    children: React.ReactNode;
    confirmationText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, children, confirmationText }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef, isOpen);
    const [inputText, setInputText] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        setInputText(''); // Reset text on open
        
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        document.body.classList.add('modal-open');
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.classList.remove('modal-open');
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const isConfirmDisabled = confirmationText ? inputText !== confirmationText : false;

    return (
        <div 
            className="fixed inset-0 bg-bg-primary bg-opacity-80 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                ref={modalRef}
                className="bg-bg-secondary rounded-lg shadow-xl w-full max-w-md border-2 border-border-accent flex flex-col animate-slide-in-up"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirmation-title"
            >
                <div className="flex items-center justify-between p-4 border-b border-border-accent">
                    <h2 id="confirmation-title" className="text-xl font-bold text-text-primary">{title}</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-text-secondary hover:bg-border-accent" aria-label="Close confirmation dialog">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>
                <div className="p-6 text-text-primary">
                    {children}
                </div>
                 {confirmationText && (
                    <div className="px-6 pb-4">
                        <label htmlFor="confirmationInput" className="block text-sm font-medium text-text-primary mb-1">
                            Type <strong className="text-danger-fg">{confirmationText}</strong> to confirm.
                        </label>
                        <input
                            id="confirmationInput"
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            className="w-full bg-bg-primary border border-border-accent rounded-md py-2 px-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition"
                            autoComplete="off"
                        />
                    </div>
                )}
                <div className="p-4 bg-bg-primary rounded-b-lg border-t border-border-accent flex justify-end space-x-3">
                    <button 
                        onClick={onClose} 
                        className="bg-border-accent hover:bg-accent-hover text-text-primary font-bold py-2 px-4 rounded-md transition duration-300"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleConfirm}
                        disabled={isConfirmDisabled}
                        className="bg-danger-fg hover:bg-opacity-80 text-accent-text font-bold py-2 px-4 rounded-md transition duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <TrashIcon className="w-5 h-5" />
                        <span>Confirm</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;