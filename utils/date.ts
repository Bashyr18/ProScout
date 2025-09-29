export const calculateDaysLeft = (deadline: string | null): { text: string; style: string } => {
    if (!deadline) return { text: 'N/A', style: 'text-text-secondary' };
    
    try {
        const deadlineDate = new Date(deadline);
        if (isNaN(deadlineDate.getTime())) return { text: 'Invalid Date', style: 'text-warning-fg' };
        
        // Use UTC dates for comparison to avoid timezone issues
        const deadlineUTC = new Date(Date.UTC(deadlineDate.getUTCFullYear(), deadlineDate.getUTCMonth(), deadlineDate.getUTCDate()));
        const now = new Date();
        const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        
        const diffTime = deadlineUTC.getTime() - todayUTC.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return { text: `${Math.abs(diffDays)} days ago`, style: 'text-danger-fg font-semibold' };
        if (diffDays <= 7) return { text: `${diffDays} days`, style: 'text-warning-fg font-semibold' };
        return { text: `${diffDays} days`, style: 'text-text-secondary' };

    } catch(e) {
        console.error("Error calculating days left for deadline:", deadline, e);
        return { text: 'Error', style: 'text-danger-fg' };
    }
};