import React from 'react';
import { useAppStore } from '../store/useAppStore.ts';
import { useModal } from '../hooks/useModal.ts';
import { Agent, AgentStatus } from '../types.ts';
import { RobotIcon, PlusIcon, PlayIcon, PauseIcon, TrashIcon, CogIcon, XCircleIcon } from './icons.tsx';
import { formatDistanceToNow } from 'date-fns';

const getStatusStyles = (status: AgentStatus): { bg: string, text: string, icon?: React.ReactNode } => {
    switch(status) {
        case 'active': return { bg: 'bg-success-bg', text: 'text-success-fg', icon: <div className="w-2 h-2 rounded-full bg-success-fg animate-pulse"></div> };
        case 'paused': return { bg: 'bg-warning-bg', text: 'text-warning-fg', icon: <PauseIcon className="w-3 h-3"/> };
        case 'running': return { bg: 'bg-info-bg', text: 'text-info-fg', icon: <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div> };
        case 'error': return { bg: 'bg-danger-bg', text: 'text-danger-fg', icon: <XCircleIcon className="w-4 h-4" /> };
        default: return { bg: 'bg-bg-primary', text: 'text-text-secondary' };
    }
}

const AgentCard: React.FC<{ agent: Agent }> = ({ agent }) => {
    const { toggleAgentStatus, runAgentMission, deleteAgent } = useAppStore();
    const { openModal } = useModal();

    const handleDelete = () => {
        openModal('confirmation', {
            title: 'Delete Agent',
            message: <p>Are you sure you want to delete the agent: <strong className="text-text-primary">{agent.name}</strong>? This is irreversible.</p>,
            onConfirm: () => deleteAgent(agent.id)
        });
    }
    
    return (
        <div className="bg-bg-secondary p-4 rounded-lg border border-border-accent flex flex-col space-y-3">
            <div className="flex justify-between items-start">
                <div className="flex-grow pr-4">
                    <h3 className="font-bold text-text-primary">{agent.name}</h3>
                    <p className="text-sm text-text-secondary truncate" title={agent.searchParams.query}>{agent.searchParams.query}</p>
                </div>
                 <span className={`px-2 py-1 inline-flex items-center space-x-1.5 text-xs leading-5 font-semibold rounded-full border ${getStatusStyles(agent.status).bg} ${getStatusStyles(agent.status).text}`}>
                    {getStatusStyles(agent.status).icon}
                    <span className="capitalize">{agent.status}</span>
                </span>
            </div>
            <div className="text-xs text-text-secondary border-t border-border-accent pt-3 space-y-2">
                 <div className="flex justify-between"><span>Frequency:</span> <span className="font-medium text-text-primary">{formatDistanceToNow(Date.now() + agent.frequency, { addSuffix: false, includeSeconds: false })}</span></div>
                 <div className="flex justify-between"><span>Last Run:</span> <span className="font-medium text-text-primary">{agent.lastRun ? formatDistanceToNow(agent.lastRun, { addSuffix: true }) : 'Never'}</span></div>
                 <div className="flex justify-between"><span>Last Found:</span> <span className="font-medium text-text-primary">{agent.lastFoundCount}</span></div>
            </div>
             <div className="flex items-center justify-end space-x-2 border-t border-border-accent pt-3">
                <button onClick={() => runAgentMission(agent.id)} disabled={agent.status === 'running'} title="Run Now" className="p-2 rounded-md bg-border-accent hover:bg-accent-hover text-text-primary transition disabled:opacity-50"><CogIcon className="w-5 h-5"/></button>
                <button onClick={() => openModal('agent', { agent })} title="Edit" className="p-2 rounded-md bg-border-accent hover:bg-accent-hover text-text-primary transition"><PlusIcon className="w-5 h-5"/></button>
                <button onClick={() => toggleAgentStatus(agent.id)} disabled={agent.status === 'running'} title={agent.status === 'active' ? 'Pause' : 'Resume'} className="p-2 rounded-md bg-border-accent hover:bg-accent-hover text-text-primary transition disabled:opacity-50">{agent.status === 'active' ? <PauseIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5"/>}</button>
                <button onClick={handleDelete} title="Delete" className="p-2 rounded-md bg-danger-bg hover:bg-danger-border text-danger-fg transition"><TrashIcon className="w-5 h-5"/></button>
             </div>
        </div>
    )
}

const AgentRow: React.FC<{ agent: Agent }> = ({ agent }) => {
    const { toggleAgentStatus, runAgentMission, deleteAgent } = useAppStore();
    const { openModal } = useModal();
    const statusInfo = getStatusStyles(agent.status);

    const handleDelete = () => {
        openModal('confirmation', {
            title: 'Delete Agent',
            message: <p>Are you sure you want to delete the agent: <strong className="text-text-primary">{agent.name}</strong>? This is irreversible.</p>,
            onConfirm: () => deleteAgent(agent.id)
        });
    }
    
    return (
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1.5fr] gap-4 px-4 py-3 items-center hover:bg-bg-primary transition-colors">
            <div className="truncate">
                <p className="font-bold text-text-primary truncate">{agent.name}</p>
                <p className="text-xs text-text-secondary truncate" title={agent.searchParams.query}>{agent.searchParams.query}</p>
            </div>
            <div>
                <span className={`px-2 py-1 inline-flex items-center space-x-1.5 text-xs leading-5 font-semibold rounded-full border ${statusInfo.bg} ${statusInfo.text}`}>
                    {statusInfo.icon}
                    <span className="capitalize">{agent.status}</span>
                </span>
            </div>
            <div className="text-sm text-text-primary">
                {formatDistanceToNow(Date.now() + agent.frequency, { addSuffix: false, includeSeconds: false })}
            </div>
            <div className="text-sm text-text-primary">
                {agent.lastRun ? formatDistanceToNow(agent.lastRun, { addSuffix: true }) : 'Never'}
            </div>
            <div className="text-sm font-bold text-text-primary text-center">{agent.lastFoundCount}</div>
            <div className="flex items-center justify-end space-x-1">
                 <button onClick={() => runAgentMission(agent.id)} disabled={agent.status === 'running'} title="Run Now" className="p-2 rounded-md bg-border-accent hover:bg-accent-hover text-text-primary transition disabled:opacity-50"><CogIcon className="w-4 h-4"/></button>
                <button onClick={() => openModal('agent', { agent })} title="Edit" className="p-2 rounded-md bg-border-accent hover:bg-accent-hover text-text-primary transition"><PlusIcon className="w-4 h-4"/></button>
                <button onClick={() => toggleAgentStatus(agent.id)} disabled={agent.status === 'running'} title={agent.status === 'active' ? 'Pause' : 'Resume'} className="p-2 rounded-md bg-border-accent hover:bg-accent-hover text-text-primary transition disabled:opacity-50">{agent.status === 'active' ? <PauseIcon className="w-4 h-4"/> : <PlayIcon className="w-4 h-4"/>}</button>
                <button onClick={handleDelete} title="Delete" className="p-2 rounded-md bg-danger-bg hover:bg-danger-border text-danger-fg transition"><TrashIcon className="w-4 h-4"/></button>
            </div>
        </div>
    );
}

const AgentPanel: React.FC = () => {
    const { agentIds, agentsById } = useAppStore(state => ({
        agentIds: state.agentIds,
        agentsById: state.agentsById,
    }));
    const { openModal } = useModal();

    if (agentIds.length === 0) {
        return (
            <div className="text-center py-16 text-text-secondary bg-bg-secondary rounded-lg border border-border-accent">
                <RobotIcon className="w-12 h-12 text-border-accent mx-auto" />
                <p className="mt-4 font-bold text-lg text-text-primary">No Persistent Agents Created</p>
                <p className="mt-1 mb-4">Create agents to automatically scout for opportunities 24/7.</p>
                <button onClick={() => openModal('agent')} className="bg-accent hover:bg-opacity-90 text-accent-text font-bold py-2 px-4 rounded-md transition duration-300 inline-flex items-center space-x-2">
                    <PlusIcon className="w-5 h-5" />
                    <span>Create Your First Agent</span>
                </button>
            </div>
        )
    }

    return (
        <div className="animate-fade-in">
            <div className="flex justify-end mb-4">
                 <button onClick={() => openModal('agent')} className="bg-accent hover:bg-opacity-90 text-accent-text font-bold py-2 px-4 rounded-md transition duration-300 inline-flex items-center space-x-2">
                    <PlusIcon className="w-5 h-5" />
                    <span>Create New Agent</span>
                </button>
            </div>

            {/* Desktop List View */}
            <div className="hidden lg:block bg-bg-secondary rounded-lg border border-border-accent">
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1.5fr] gap-4 px-4 py-2 font-bold text-text-secondary text-xs uppercase tracking-wider border-b border-border-accent">
                    <span>Agent Name</span>
                    <span>Status</span>
                    <span>Frequency</span>
                    <span>Last Run</span>
                    <span>Last Found</span>
                    <span className="text-right">Actions</span>
                </div>
                <div className="divide-y divide-border-accent">
                     {agentIds.map(id => <AgentRow key={id} agent={agentsById[id]} />)}
                </div>
            </div>

            {/* Mobile Grid View */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
                {agentIds.map(id => <AgentCard key={id} agent={agentsById[id]} />)}
            </div>
        </div>
    );
};

export default AgentPanel;