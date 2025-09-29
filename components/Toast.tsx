import React from 'react';
import { useAppStore } from '../store/useAppStore.ts';
import { Toast as ToastType } from '../types.ts';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, CloseIcon } from './icons.tsx';

interface ToastProps {
    toast: ToastType;
}

const ICONS: Record<ToastType['type'], React.ReactNode> = {
    success: <CheckCircleIcon className="w-6 h-6 text-success-fg" />,
    error: <XCircleIcon className="w-6 h-6 text-danger-fg" />,
    info: <InformationCircleIcon className="w-6 h-6 text-info-fg" />,
};

const BORDER_COLORS: Record<ToastType['type'], string> = {
    success: 'border-success-border',
    error: 'border-danger-border',
    info: 'border-info-border',
};

const Toast: React.FC<ToastProps> = ({ toast }) => {
    const removeToast = useAppStore(state => state.removeToast);

    return (
        <div 
            role="alert"
            className={`flex items-start p-4 w-full bg-bg-secondary rounded-lg shadow-lg border-l-4 animate-slide-in-left ${BORDER_COLORS[toast.type]}`}
        >
            <div className="flex-shrink-0">
                {ICONS[toast.type]}
            </div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
                <p className="text-sm font-medium text-text-primary">
                    {toast.message}
                </p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
                <button
                    onClick={() => removeToast(toast.id)}
                    className="inline-flex rounded-md p-1 text-text-secondary hover:bg-border-accent focus:outline-none focus:ring-2 focus:ring-accent"
                >
                    <span className="sr-only">Close</span>
                    <CloseIcon className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
};

export default Toast;