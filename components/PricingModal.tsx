import React from 'react';
import { useAppStore } from '../store/useAppStore.ts';
import { CloseIcon, SparklesIcon, CheckCircleIcon } from './icons.tsx';

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
    const { 
        user, 
        isInitiatingPayment,
        initiatePayment, 
    } = useAppStore(state => ({
        user: state.user,
        isInitiatingPayment: state.isInitiatingPayment,
        initiatePayment: state.initiatePayment,
    }));
    
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-bg-primary bg-opacity-90 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-bg-secondary rounded-lg shadow-xl w-full max-w-4xl border-2 border-border-accent flex flex-col relative animate-slide-in-up"
                role="dialog"
                aria-modal="true"
                aria-labelledby="pricing-title"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full text-text-secondary hover:bg-border-accent transition-colors z-10" aria-label="Close dialog">
                    <CloseIcon className="w-6 h-6"/>
                </button>

                <div className="p-6 text-center border-b border-border-accent">
                    <h2 id="pricing-title" className="text-3xl font-bold text-text-primary">Choose Your Pathfinder Plan</h2>
                    <p className="text-text-secondary mt-2">Unlock all premium features and supercharge your search.</p>
                </div>

                <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Pro Plan */}
                    <div className="bg-bg-primary p-6 rounded-lg border-2 border-border-accent flex flex-col relative">
                        <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-border-accent text-text-primary px-3 py-1 text-sm font-bold rounded-full">PRO</div>
                        <h3 className="text-2xl font-semibold text-text-primary">Pathfinder (Pro)</h3>
                        <p className="text-text-secondary mb-4">For professionals & teams</p>
                        <p className="text-5xl font-bold text-text-primary mb-6">$97<span className="text-lg font-medium text-text-secondary"> / month</span></p>
                        <ul className="space-y-3 text-text-primary mb-8 flex-grow">
                            <li className="flex items-center"><CheckCircleIcon className="w-5 h-5 text-accent mr-3"/>50 Agent Dispatches / mo</li>
                            <li className="flex items-center"><CheckCircleIcon className="w-5 h-5 text-accent mr-3"/>100 AI Insights / mo</li>
                            <li className="flex items-center"><CheckCircleIcon className="w-5 h-5 text-accent mr-3"/>Unlimited AI Chat Messages</li>
                            <li className="flex items-center"><CheckCircleIcon className="w-5 h-5 text-accent mr-3"/>Custom Company Profile</li>
                            <li className="flex items-center"><CheckCircleIcon className="w-5 h-5 text-accent mr-3"/>Export to Excel</li>
                        </ul>
                        <button 
                            onClick={() => initiatePayment('pro')} 
                            disabled={user?.planId === 'pro' || isInitiatingPayment} 
                            className="w-full bg-border-accent hover:bg-accent-hover text-text-primary font-bold py-3 px-4 rounded-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isInitiatingPayment ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div> : (user?.planId === 'pro' ? 'Current Plan' : 'Choose Pro')}
                        </button>
                    </div>
                    {/* Lifetime Plan */}
                    <div className="bg-bg-primary p-6 rounded-lg border-2 border-accent flex flex-col relative">
                        <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-accent text-accent-text px-3 py-1 text-sm font-bold rounded-full">LIFETIME</div>
                        <h3 className="text-2xl font-semibold text-accent">Pathfinder (Lifetime)</h3>
                        <p className="text-text-secondary mb-4">Pay once, scout forever</p>
                        <p className="text-5xl font-bold text-text-primary mb-6">$999<span className="text-lg font-medium text-text-secondary"> one-time</span></p>
                        <ul className="space-y-3 text-text-primary mb-8 flex-grow">
                            <li className="flex items-center"><SparklesIcon className="w-5 h-5 text-accent mr-3"/>Everything in Pro</li>
                            <li className="flex items-center"><SparklesIcon className="w-5 h-5 text-accent mr-3"/>Unlimited Usage, Forever</li>
                            <li className="flex items-center"><SparklesIcon className="w-5 h-5 text-accent mr-3"/>Priority Support</li>
                            <li className="flex items-center"><SparklesIcon className="w-5 h-5 text-accent mr-3"/>Early Access to New Features</li>
                            <li className="flex items-center"><SparklesIcon className="w-5 h-5 text-accent mr-3"/>Never worry about limits again</li>
                        </ul>
                         <button 
                            onClick={() => initiatePayment('lifetime')} 
                            disabled={user?.planId === 'lifetime' || isInitiatingPayment} 
                            className="w-full bg-accent hover:bg-opacity-90 text-accent-text font-bold py-3 px-4 rounded-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                             {isInitiatingPayment ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div> : (user?.planId === 'lifetime' ? 'Your Plan for Life' : 'Go Lifetime')}
                        </button>
                    </div>
                </div>
                 <div className="p-4 text-center text-xs text-text-secondary">
                    Secure payments are handled by Flutterwave.
                </div>
            </div>
        </div>
    );
};

export default PricingModal;