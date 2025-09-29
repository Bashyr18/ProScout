import React, { createContext, useState, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Opportunity, Agent, SearchParams } from '../types.ts';

// Import all modal components
import AuthModal from '../components/AuthModal.tsx';
import PricingModal from '../components/PricingModal.tsx';
import SettingsModal from '../components/SettingsModal.tsx';
import SaveSearchModal from '../components/SaveSearchModal.tsx';
import AgentModal from '../components/modals/AgentModal.tsx';
import ManualAddModal from '../components/ManualAddModal.tsx';
import OpportunityDetailModal from '../components/OpportunityDetailModal.tsx';
import ConfirmationModal from '../components/ConfirmationModal.tsx';
import TextImportModal from '../components/modals/TextImportModal.tsx';

export type ModalType = 'auth' | 'pricing' | 'settings' | 'saveSearch' | 'agent' | 'manualAdd' | 'opportunityDetail' | 'confirmation' | 'textImport';

export interface ModalProps {
    opportunity?: Opportunity;
    agent?: Agent;
    searchParams?: SearchParams;
    title?: string;
    message?: any;
    onConfirm?: () => void;
    confirmationText?: string;
    frequency?: number;
}

interface ModalContextType {
    openModal: (type: ModalType, props?: ModalProps) => void;
    closeModal: () => void;
}

// Create a context with a default dummy value
export const ModalContext = createContext<ModalContextType>({
    openModal: () => console.warn('ModalProvider not found'),
    closeModal: () => console.warn('ModalProvider not found'),
});

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [modalState, setModalState] = useState<{ type: ModalType | null; props: ModalProps }>({ type: null, props: {} });

    const openModal = useCallback((type: ModalType, props: ModalProps = {}) => {
        setModalState({ type, props });
    }, []);

    const closeModal = useCallback(() => {
        setModalState({ type: null, props: {} });
    }, []);

    const contextValue = useMemo(() => ({ openModal, closeModal }), [openModal, closeModal]);
    
    // Portal target
    const modalRoot = typeof document !== 'undefined' ? document.getElementById('modal-root') : null;
    
    const renderModals = () => {
        if (!modalRoot) return null;

        return ReactDOM.createPortal(
            <>
                <AuthModal
                    isOpen={modalState.type === 'auth'}
                    onClose={closeModal}
                />
                <PricingModal
                    isOpen={modalState.type === 'pricing'}
                    onClose={closeModal}
                />
                <SettingsModal
                    isOpen={modalState.type === 'settings'}
                    onClose={closeModal}
                />
                <SaveSearchModal
                    isOpen={modalState.type === 'saveSearch'}
                    onClose={closeModal}
                    searchParamsToSave={modalState.props.searchParams}
                />
                <AgentModal
                    isOpen={modalState.type === 'agent'}
                    onClose={closeModal}
                    editingAgent={modalState.props.agent}
                    searchParamsToSave={modalState.props.searchParams}
                    frequency={modalState.props.frequency}
                />
                <ManualAddModal
                    isOpen={modalState.type === 'manualAdd'}
                    onClose={closeModal}
                />
                <OpportunityDetailModal
                    isOpen={modalState.type === 'opportunityDetail'}
                    onClose={closeModal}
                    opportunity={modalState.props.opportunity}
                />
                <ConfirmationModal
                    isOpen={modalState.type === 'confirmation'}
                    onClose={closeModal}
                    onConfirm={modalState.props.onConfirm || (() => {})}
                    title={modalState.props.title || 'Confirm'}
                    confirmationText={modalState.props.confirmationText}
                >
                    {modalState.props.message}
                </ConfirmationModal>
                <TextImportModal
                    isOpen={modalState.type === 'textImport'}
                    onClose={closeModal}
                />
            </>,
            modalRoot
        );
    };

    return (
        <ModalContext.Provider value={contextValue}>
            {children}
            {renderModals()}
        </ModalContext.Provider>
    );
};