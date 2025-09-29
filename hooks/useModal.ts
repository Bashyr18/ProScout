import { useContext } from 'react';
import { ModalContext } from '../contexts/ModalContext.tsx';

/**
 * Custom hook to access the modal context.
 * Provides `openModal` and `closeModal` functions.
 * @returns {object} The modal context.
 * @throws {Error} If used outside of a ModalProvider.
 */
export const useModal = () => {
    const context = useContext(ModalContext);
    if (context === undefined) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};
