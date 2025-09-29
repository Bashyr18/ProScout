import React from 'react';
import ReactDOM from 'react-dom';
import { useAppStore } from '../store/useAppStore.ts';
import Toast from './Toast.tsx';

const ToastContainer: React.FC = () => {
    const toasts = useAppStore(state => state.toasts);

    const container = (
        <div className="fixed top-4 right-4 z-[100] w-full max-w-sm space-y-3">
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} />
            ))}
        </div>
    );
    
    const modalRoot = document.getElementById('modal-root');
    return modalRoot ? ReactDOM.createPortal(container, modalRoot) : null;
};

export default ToastContainer;