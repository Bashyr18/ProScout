import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore.ts';
import { CheckCircleIcon, XCircleIcon, SearchIcon } from './icons.tsx';

const PaymentVerificationPage: React.FC = () => {
    const { 
        verifyPayment, 
        isInitiatingPayment, 
        paymentError 
    } = useAppStore(state => ({
        verifyPayment: state.verifyPayment,
        isInitiatingPayment: state.isInitiatingPayment,
        paymentError: state.paymentError,
    }));
    
    const [verificationDone, setVerificationDone] = useState(false);

    useEffect(() => {
        const verify = async () => {
            const params = new URLSearchParams(window.location.search);
            const transaction_id = params.get('transaction_id');
            const tx_ref = params.get('tx_ref');

            if (transaction_id && tx_ref) {
                await verifyPayment({ transaction_id, tx_ref });
                setVerificationDone(true);
            } else {
                 // Handle case where params are missing
                 useAppStore.getState().setPaymentError("Payment verification parameters are missing from the URL.");
                 setVerificationDone(true);
            }
        };
        verify();
    }, [verifyPayment]);

    const handleContinue = () => {
        // Clear query params and navigate to the home page
        window.history.pushState({}, document.title, window.location.pathname);
        window.location.reload(); // Easiest way to reset state cleanly
    };

    const StatusDisplay = () => {
        if (!verificationDone) {
            return (
                <>
                    <div className="relative flex items-center justify-center w-24 h-24 md:w-32 md:h-32 mb-6">
                        <div className="absolute inset-0 opacity-20 rounded-full sonar-ping"></div>
                        <div className="relative bg-bg-primary rounded-full p-4 border-2 border-accent">
                            <SearchIcon className="w-10 h-10 md:w-12 md:h-12 text-accent" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-text-primary mb-2">Verifying Your Payment...</h2>
                    <p className="text-text-secondary">Please wait while we securely confirm your transaction. Do not close this window.</p>
                </>
            );
        }

        if (paymentError) {
            return (
                 <>
                    <XCircleIcon className="w-20 h-20 text-danger-fg mb-4" />
                    <h2 className="text-2xl font-bold text-text-primary mb-2">Payment Verification Failed</h2>
                    <p className="text-text-secondary mb-4">There was an issue verifying your payment.</p>
                    <p className="text-sm text-danger-fg bg-danger-bg p-3 rounded-md">{paymentError}</p>
                    <button onClick={handleContinue} className="mt-6 bg-border-accent hover:bg-accent-hover text-text-primary font-bold py-2 px-6 rounded-md transition duration-300">
                        Return to Dashboard
                    </button>
                </>
            );
        }

        return (
            <>
                <CheckCircleIcon className="w-20 h-20 text-accent mb-4" />
                <h2 className="text-2xl font-bold text-text-primary mb-2">Upgrade Successful!</h2>
                <p className="text-text-secondary mb-6">Your account has been upgraded. Welcome to Pro! All premium features are now unlocked.</p>
                <button onClick={handleContinue} className="bg-accent hover:bg-opacity-90 text-accent-text font-bold py-2 px-6 rounded-md transition duration-300">
                    Let's Go!
                </button>
            </>
        );
    };

    return (
        <div className="bg-bg-secondary rounded-lg shadow-lg p-8 flex flex-col items-center justify-center text-center animate-fade-in border border-border-accent my-8">
            <StatusDisplay />
        </div>
    );
};

export default PaymentVerificationPage;