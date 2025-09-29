import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore.ts';
import { CloseIcon, UserCircleIcon, KeyIcon, SparklesIcon } from './icons.tsx';
import { useFocusTrap } from '../hooks/useFocusTrap.ts';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const { login, signUp } = useAppStore(state => ({
        login: state.login,
        signUp: state.signUp,
    }));

    const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [promoCode, setPromoCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef, isOpen);

    useEffect(() => {
        if (isOpen) {
            // Reset state when modal opens
            setError('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setPromoCode('');
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (activeTab === 'login') {
                await login(email, password);
            } else {
                if (password !== confirmPassword) {
                    throw new Error("Passwords do not match.");
                }
                if (password.length < 6) {
                    throw new Error("Password must be at least 6 characters long.");
                }
                await signUp(email, password, promoCode);
            }
            onClose();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-bg-primary bg-opacity-90 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div
                ref={modalRef}
                className="bg-bg-secondary rounded-lg shadow-xl w-full max-w-md border-2 border-border-accent flex flex-col animate-slide-in-up"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="auth-title"
            >
                <div className="relative p-4 border-b border-border-accent">
                    <h2 id="auth-title" className="text-2xl font-bold text-text-primary text-center">
                        {activeTab === 'login' ? 'Welcome Back' : 'Create Your Account'}
                    </h2>
                    <button onClick={onClose} className="absolute top-2 right-2 p-2 rounded-full text-text-secondary hover:bg-border-accent" aria-label="Close dialog">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>

                <div className="p-6">
                    <div className="flex border-b border-border-accent mb-6">
                        <button
                            onClick={() => setActiveTab('login')}
                            className={`flex-1 py-2 text-center font-semibold transition-colors ${activeTab === 'login' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => setActiveTab('signup')}
                            className={`flex-1 py-2 text-center font-semibold transition-colors ${activeTab === 'signup' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            Sign Up
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">Email Address</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <UserCircleIcon className="w-5 h-5 text-text-secondary"/>
                                </span>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-bg-primary border border-border-accent rounded-md py-2 pl-10 pr-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition"
                                />
                            </div>
                        </div>
                        <div>
                             <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">Password</label>
                            <div className="relative">
                               <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <KeyIcon className="w-5 h-5 text-text-secondary"/>
                                </span>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full bg-bg-primary border border-border-accent rounded-md py-2 pl-10 pr-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition"
                                />
                            </div>
                        </div>

                        {activeTab === 'signup' && (
                            <>
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary mb-1">Confirm Password</label>
                                     <div className="relative">
                                         <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                             <KeyIcon className="w-5 h-5 text-text-secondary"/>
                                         </span>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="w-full bg-bg-primary border border-border-accent rounded-md py-2 pl-10 pr-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="promoCode" className="block text-sm font-medium text-text-secondary mb-1">Promo Code (Optional)</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                            <SparklesIcon className="w-5 h-5 text-text-secondary" />
                                        </span>
                                        <input
                                            type="text"
                                            id="promoCode"
                                            value={promoCode}
                                            onChange={(e) => setPromoCode(e.target.value)}
                                            placeholder="Enter promo code"
                                            className="w-full bg-bg-primary border border-border-accent rounded-md py-2 pl-10 pr-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition"
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                        
                        {error && (
                            <p className="text-danger-fg text-sm text-center bg-danger-bg p-2 rounded-md">{error}</p>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full mt-4 flex items-center justify-center bg-accent hover:bg-opacity-90 text-accent-text font-bold py-3 px-4 rounded-md transition duration-300 disabled:opacity-50"
                            >
                                {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div> : (activeTab === 'login' ? 'Log In' : 'Create Account')}
                            </button>
                        </div>
                    </form>
                    {activeTab === 'signup' && (
                        <p className="text-xs text-text-secondary text-center mt-4">
                            By signing up, you agree to our fictitious Terms of Service.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthModal;