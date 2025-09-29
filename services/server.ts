// --- THIS FILE REPRESENTS A SECURE BACKEND SERVER ---
// In a real application, this code would live on a server (e.g., Node.js, Cloud Function).
// The secret key is stored securely on the server and is never exposed to the client.

import { User, PlanId } from '../types.ts';

// ** IMPORTANT ** This is a placeholder. In a real application, this would be a securely stored environment variable on your server.
const FLUTTERWAVE_SECRET_KEY = 'YOUR_FLUTTERWAVE_SECRET_KEY';
const APP_URL = window.location.origin;

const PLAN_PRICES: Record<PlanId, number> = {
    free: 0,
    pro: 97,
    lifetime: 999
};

const PLAN_CURRENCY: Record<PlanId, string> = {
    free: 'USD',
    pro: 'USD',
    lifetime: 'USD'
};

interface Transaction {
    paymentLink: string;
    tx_ref: string;
}

interface VerificationResult {
    success: boolean;
    message: string;
    userId: string;
    planId: PlanId;
}

/**
 * Initializes a payment transaction with Flutterwave.
 * In a real backend, this would make an API call to Flutterwave.
 * Here, we simulate this by creating a redirect URL.
 */
export async function initializePaymentTransaction(user: User, planId: PlanId): Promise<Transaction> {
    console.log(`SERVER: Initializing payment for user ${user.id} for plan ${planId}`);
    
    // This is a simulation. A real implementation would use fetch() to call Flutterwave's API.
    // e.g., const response = await fetch('https://api.flutterwave.com/v3/payments', { ... });
    // For this demo, we'll construct a mock redirect URL.

    if (planId === 'free') {
        throw new Error("Cannot initiate payment for a free plan.");
    }
    
    const tx_ref = `proscout-${user.id}-${planId}-${Date.now()}`;
    const amount = PLAN_PRICES[planId];
    const currency = PLAN_CURRENCY[planId];
    
    // This simulates the payment link we would get back from Flutterwave API
    const paymentLink = `https://checkout.flutterwave.com/v3.js`; // This is the library, not the link itself
    
    // We simulate the redirect by calling the library on the client side.
    // For a real redirect flow, the `paymentLink` would be the one from the API response.
    // For this simulation, we will trigger the payment modal on the client.

    return new Promise((resolve, reject) => {
        // @ts-ignore
        const paymentModal = FlutterwaveCheckout({
            public_key: 'FLWPUBK-36801a5e7b4f185967bab01b0f99513e-X', // Use your Flutterwave public test key
            tx_ref,
            amount,
            currency,
            payment_options: "card, mobilemoneyghana, ussd",
            redirect_url: `${APP_URL}/?status=completed&tx_ref=${tx_ref}`,
            meta: {
                userId: user.id,
                planId: planId,
            },
            customer: {
                email: user.email,
                name: user.email,
            },
            customizations: {
                title: "ProScout AI",
                description: `Payment for ${planId} plan`,
                logo: "https://www.logolynx.com/images/logolynx/22/2239ca38f5505f53255a7424340d512a.png", // Replace with your logo
            },
            onclose: () => {
                 // This is called if the user closes the modal without paying.
                 // We don't need to reject here, as the user might just be closing the window.
                 console.log("Payment modal closed by user.");
            },
        });

        // We don't get a payment link directly with the inline method,
        // the library handles the redirect. So we'll resolve with the tx_ref.
        // The redirect URL is what brings the user back for verification.
        resolve({
            paymentLink: `#`, // The modal is opened, no direct link needed.
            tx_ref
        });
    });
}

/**
 * Verifies a payment transaction.
 * In a real backend, this would make a server-to-server API call to Flutterwave to prevent tampering.
 */
export async function verifyPaymentTransaction(params: { transaction_id: string, tx_ref: string }): Promise<VerificationResult> {
    console.log(`SERVER: Verifying transaction`, params);
    
    // ** SIMULATION **
    // In a real backend, you would:
    // 1. Extract the transaction_id from the params.
    // 2. Make a GET request to `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`
    //    with your secret key in the Authorization header.
    // 3. Check if the response status is 'success', and if the tx_ref and amount match your records.
    
    await new Promise(res => setTimeout(res, 1500)); // Simulate network latency
    
    // For this simulation, we'll assume the payment is always successful if it reaches this point.
    // We'll decode the user ID and plan ID from our simulated tx_ref.
    const parts = params.tx_ref.split('-');
    const userId = parts[1];
    const planId = parts[2] as PlanId;

    if (userId && (planId === 'pro' || planId === 'lifetime')) {
         return {
            success: true,
            message: 'Payment verified successfully.',
            userId,
            planId
        };
    }

    return {
        success: false,
        message: 'Payment verification failed. Could not extract user details from transaction reference.',
        userId: '',
        planId: 'free',
    };
}