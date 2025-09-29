import React from 'react';
import { Opportunity } from '../../types.ts';

interface StatusBadgeProps {
    status: Opportunity['status'];
    className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = React.memo(({ status, className = '' }) => {
    const statusStyles: Record<Opportunity['status'], string> = {
        New: 'bg-info-bg text-info-fg border-info-border',
        Reviewing: 'bg-warning-bg text-warning-fg border-warning-border',
        Action: 'bg-success-bg text-success-fg border-success-border',
        Discarded: 'bg-danger-bg text-danger-fg border-danger-border',
    };
    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${statusStyles[status]} ${className}`}>
            {status}
        </span>
    );
});

export default StatusBadge;