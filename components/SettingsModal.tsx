import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore.ts';
import { useModal } from '../hooks/useModal.ts';
import { CloseIcon, SparklesIcon, UserCircleIcon, BriefcaseIcon, KeyIcon, CreditCardIcon, SunIcon, MoonIcon } from './icons.tsx';
import { useFocusTrap } from '../hooks/useFocusTrap.ts';
import { PLAN_QUOTAS } from '../constants.ts';
import { Theme } from '../types.ts';

const PLAN_NAMES: Record<string, string> = {
    free: "Scout (Free)",
    pro: "Pathfinder (Pro)",
    lifetime: "Pathfinder (Lifetime)"
};

const TABS = ['Profile', 'Plan & Billing', 'Security', 'Appearance'];

const UsageBar: React.FC<{ used: number, limit: number | 'unlimited', name: string }> = ({ used, limit, name }) => {
    if (limit === 'unlimited') {
        return (
            <div>
                <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-text-secondary">{name}</span>
                    <span className="font-bold text-accent">Unlimited</span>
                </div>
                <div className="w-full bg-border-accent rounded-full h-2.5">
                    <div className="bg-accent h-2.5 rounded-full" style={{ width: '100%' }}></div>
                </div>
            </div>
        )
    }
    
    const percentage = Math.min((used / limit) * 100, 100);
    const isOver = used >= limit;

    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-text-secondary">{name}</span>
                <span className={`font-bold ${isOver ? 'text-danger-fg' : 'text-text-primary'}`}>{used} / {limit}</span>
            </div>
            <div className="w-full bg-border-accent rounded-full h-2.5">
                <div className={`${isOver ? 'bg-danger-fg' : 'bg-accent'} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

const ProfileTab: React.FC = () => {
    const { user, updateUserProfile, canCustomizeProfile } = useAppStore(state => ({ 
        user: state.user, 
        updateUserProfile: state.updateUserProfile,
        canCustomizeProfile: state.canCustomizeProfile
    }));
    const [name, setName] = useState(user?.companyName || '');
    const [profile, setProfile] = useState(user?.companyProfile || '');
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setName(user?.companyName || '');
        setProfile(user?.companyProfile || '');
    }, [user?.companyName, user?.companyProfile]);

    const handleSaveProfile = () => {
        setIsSaving(true);
        updateUserProfile({ name, profile });
        setTimeout(() => {
            setIsSaving(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }, 1000);
    };
    
    return (
        <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-text-primary mb-2 flex items-center"><BriefcaseIcon className="w-5 h-5 mr-2" />Company Profile</h3>
            
            <div className="space-y-1">
                <label htmlFor="companyName" className="block text-sm font-medium text-text-secondary">Company Name</label>
                <input
                    id="companyName"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Your Company LLC"
                    disabled={!canCustomizeProfile()}
                    className="w-full bg-bg-secondary border border-border-accent rounded-md py-2 px-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
            </div>
            
             <div className="space-y-1">
                <label htmlFor="companyProfile" className="block text-sm font-medium text-text-secondary">Company Description & Expertise</label>
                <p className="text-xs text-text-secondary">Refine your AI search results by providing your company's focus. This is used by the agent to find more relevant opportunities.</p>
                <textarea
                    id="companyProfile"
                    value={profile}
                    onChange={(e) => setProfile(e.target.value)}
                    rows={8}
                    placeholder="e.g., We are a boutique consultancy specializing in renewable energy project finance in West Africa..."
                    disabled={!canCustomizeProfile()}
                    className="w-full bg-bg-secondary border border-border-accent rounded-md py-2 px-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
            </div>

            {canCustomizeProfile() ? (
                <div className="text-right">
                     <button onClick={handleSaveProfile} disabled={isSaving || (name === (user?.companyName || '') && profile === (user?.companyProfile || ''))} className="bg-accent hover:bg-opacity-90 text-accent-text font-bold py-2 px-4 rounded-md transition duration-300 disabled:opacity-50">
                        {isSaving ? 'Saving...' : (saved ? 'Saved!' : 'Save Profile')}
                    </button>
                </div>
            ) : (
                <div className="text-center mt-3 text-sm text-warning-fg p-3 bg-warning-bg rounded-md border border-warning-border">
                    Company Profile customization is a Pro feature. Upgrade your plan to enable it.
                </div>
            )}
        </div>
    );
};

const PlanTab: React.FC = () => {
     const { user } = useAppStore(state => ({
        user: state.user!,
    }));
    const { openModal, closeModal } = useModal();
    
    const handleUpgrade = () => {
        closeModal(); // Close settings modal
        openModal('pricing'); // Open pricing modal
    };

    return (
        <div className="space-y-6 animate-fade-in">
             <div>
                <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center"><CreditCardIcon className="w-5 h-5 mr-2" />Plan & Billing</h3>
                <div className="bg-bg-primary p-4 rounded-lg border border-border-accent">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-text-secondary">Current Plan</p>
                            <p className="text-xl font-bold text-text-primary">{PLAN_NAMES[user.planId]}</p>
                        </div>
                        {user.planId !== 'lifetime' && (
                            <button onClick={handleUpgrade} className="flex items-center space-x-2 bg-accent hover:bg-opacity-90 text-accent-text font-bold py-2 px-4 rounded-md transition duration-300">
                                <SparklesIcon className="w-5 h-5"/>
                                <span>Upgrade Plan</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">This Month's Usage</h3>
                <div className="bg-bg-primary p-4 rounded-lg border border-border-accent space-y-4">
                     <UsageBar name="Agent Dispatches" used={user.usage.agentDispatches} limit={PLAN_QUOTAS[user.planId].agentDispatches} />
                     <UsageBar name="AI Insights" used={user.usage.insightsGenerations} limit={PLAN_QUOTAS[user.planId].insightsGenerations} />
                     <UsageBar name="AI Chat Messages" used={user.usage.chatMessages} limit={PLAN_QUOTAS[user.planId].chatMessages} />
                </div>
            </div>
             <div className="text-center">
                 <button onClick={() => {}} className="text-sm text-text-secondary hover:text-text-primary underline">
                   Manage Billing (Simulated)
                </button>
            </div>
        </div>
    );
};

const SecurityTab: React.FC = () => {
    const { changePassword } = useAppStore.getState();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setIsSaving(true);
        try {
            await changePassword(newPassword);
            setSuccess("Password updated successfully!");
            setNewPassword('');
            setConfirmPassword('');
        } catch(e) {
            setError((e as Error).message);
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <div className="space-y-4 animate-fade-in">
             <h3 className="text-lg font-semibold text-text-primary mb-2 flex items-center"><KeyIcon className="w-5 h-5 mr-2" />Change Password</h3>
             <form onSubmit={handleSubmit} className="space-y-4 bg-bg-primary p-4 rounded-lg border border-border-accent">
                 <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-text-secondary">New Password</label>
                    <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        required
                        className="w-full bg-bg-secondary border border-border-accent rounded-md py-2 px-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition"
                    />
                 </div>
                 <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary">Confirm New Password</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                        className="w-full bg-bg-secondary border border-border-accent rounded-md py-2 px-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition"
                    />
                 </div>
                 {error && <p className="text-danger-fg text-sm">{error}</p>}
                 {success && <p className="text-success-fg text-sm">{success}</p>}
                 <div className="text-right">
                     <button type="submit" disabled={isSaving || !newPassword} className="bg-border-accent hover:bg-accent-hover text-text-primary font-bold py-2 px-4 rounded-md transition duration-300 disabled:opacity-50">
                        {isSaving ? 'Saving...' : 'Update Password'}
                    </button>
                 </div>
             </form>
        </div>
    );
};

const AppearanceTab: React.FC = () => {
    const { theme, setTheme } = useAppStore(state => ({
        theme: state.theme,
        setTheme: state.setTheme,
    }));

    return (
        <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-text-primary mb-2 flex items-center"><SparklesIcon className="w-5 h-5 mr-2" />Appearance</h3>
            <div className="bg-bg-primary p-4 rounded-lg border border-border-accent">
                <label className="block text-sm font-medium text-text-secondary mb-2">Theme</label>
                <p className="text-xs text-text-secondary mb-3">Choose how ProScout looks. Your preference will be saved for your next visit.</p>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 rounded-lg bg-bg-secondary p-1">
                    {([
                        { value: 'light', label: 'Light', icon: <SunIcon className="w-5 h-5"/> },
                        { value: 'dark', label: 'Dark', icon: <MoonIcon className="w-5 h-5"/> },
                        { value: 'midnight', label: 'Midnight', icon: <SparklesIcon className="w-5 h-5"/> }
                    ] as {value: Theme, label: string, icon: JSX.Element}[]).map(item => (
                        <button
                            key={item.value}
                            onClick={() => setTheme(item.value)}
                            className={`flex-1 flex items-center justify-center space-x-2 rounded-md py-2 px-4 text-sm font-semibold transition-colors ${
                                theme === item.value
                                    ? 'bg-accent text-accent-text shadow'
                                    : 'text-text-primary hover:bg-border-accent'
                            }`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};


interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { user, logout } = useAppStore(state => ({
        user: state.user,
        logout: state.logout,
    }));
    
    const [activeTab, setActiveTab] = useState('Profile');
    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef, isOpen);
    
    useEffect(() => {
        if (isOpen) {
            setActiveTab('Profile');
        }
    }, [isOpen]);
    
    if (!isOpen || !user) return null;

    return (
        <div 
            className="fixed inset-0 bg-bg-primary bg-opacity-80 z-50 flex items-center justify-center p-0 md:p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                ref={modalRef}
                className="bg-bg-secondary rounded-none md:rounded-lg shadow-xl w-full h-full md:h-auto md:max-w-3xl border-2 border-border-accent flex flex-col animate-slide-in-up"
                onClick={(e) => e.stopPropagation()}
                role="dialog" aria-modal="true" aria-labelledby="settings-title"
            >
                 <div className="flex items-center justify-between p-4 border-b border-border-accent flex-shrink-0">
                    <h2 id="settings-title" className="text-xl font-bold text-text-primary flex items-center"><UserCircleIcon className="w-6 h-6 mr-2"/>Settings</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-text-secondary hover:bg-border-accent" aria-label="Close dialog">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>

                <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
                    {/* Tabs Navigation (Vertical on desktop) */}
                    <div className="flex-shrink-0 border-b md:border-b-0 md:border-r border-border-accent p-2 md:p-4">
                        <div className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-1">
                             {TABS.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`w-full text-left font-semibold p-3 rounded-md text-sm transition-colors duration-200 ${activeTab === tab ? 'bg-accent text-accent-text' : 'text-text-secondary hover:bg-border-accent hover:text-text-primary'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Tab Content */}
                    <div className="flex-grow overflow-y-auto p-4 md:p-6">
                        {activeTab === 'Profile' && <ProfileTab />}
                        {activeTab === 'Plan & Billing' && <PlanTab />}
                        {activeTab === 'Security' && <SecurityTab />}
                        {activeTab === 'Appearance' && <AppearanceTab />}
                    </div>
                </div>

                <div className="p-4 bg-bg-primary rounded-b-lg border-t border-border-accent flex justify-end items-center flex-shrink-0">
                    <button onClick={logout} className="bg-danger-fg hover:bg-opacity-80 text-accent-text font-bold py-2 px-4 rounded-md transition duration-300">
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;