import React from 'react';
import { useAppStore } from '../store/useAppStore.ts';
import { useModal } from '../hooks/useModal.ts';
import { SearchIcon, UserCircleIcon } from './icons.tsx';

const Header: React.FC = () => {
    const { user, isAuthenticated } = useAppStore(state => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
    }));
    const { openModal } = useModal();

    return (
        <header className="bg-bg-secondary p-4 shadow-md flex items-center justify-between space-x-4 border-b-2 border-border-accent sticky top-0 z-20">
             <div className="flex items-center space-x-3">
                <div className="text-accent">
                    <SearchIcon className="h-8 w-8" />
                </div>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-text-primary tracking-wider">
                        ProScout
                    </h1>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                {isAuthenticated && user ? (
                    <button onClick={() => openModal('settings')} className="flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors duration-200 p-2 rounded-lg hover:bg-border-accent">
                        <UserCircleIcon className="w-6 h-6"/>
                        <span className="hidden md:inline text-sm font-medium">{user.email}</span>
                    </button>
                ) : (
                    <button onClick={() => openModal('auth')} className="bg-accent hover:bg-opacity-90 text-accent-text font-bold py-2 px-4 rounded-md transition duration-300">
                        Log In / Sign Up
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;