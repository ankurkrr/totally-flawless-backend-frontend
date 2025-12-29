require('dotenv').config();
const KeyProvider = require('../utils/keyProvider');

// Initialize Stripe instance dynamically with key from KeyProvider
// This supports dynamic key rotation without restarting the server
let stripeInstance = null;

async function getStripeInstance() {
    if (!stripeInstance) {
        try {
            const stripeSecretKey = await KeyProvider.getStripeSecretKey();
            stripeInstance = require('stripe')(stripeSecretKey);
        } catch (error) {
            // Fallback to environment variable during migration
            const fallbackKey = process.env.STRIPE_SECRET_KEY;
            if (!fallbackKey) {
                throw new Error('STRIPE_SECRET_KEY is not set in environment variables or Key Management System');
            }
            stripeInstance = require('stripe')(fallbackKey);
        }
    }
    return stripeInstance;
}

// Initialize on module load (will be refreshed when key rotates)
getStripeInstance().catch(err => {
    console.error('Failed to initialize Stripe:', err.message);
});

// Helper functions for backward compatibility
const getCountryCode = () => {
    return 'US';
};

const getCustomer = async (customer) => {
    const instance = await getStripeInstance();
    return instance.customers.retrieve(customer);
};

const createCustomer = async (customer) => {
    const instance = await getStripeInstance();
    return instance.customers.create(customer);
};

const createEphemeralKey = async (customer) => {
    const instance = await getStripeInstance();
    return instance.ephemeralKeys.create(
        {
            customer: customer,
        },
        {
            apiVersion: '2024-06-20',
        }
    );
};

const createpaymentIntent = async (amount, customer, metadata) => {
    const instance = await getStripeInstance();
    return instance.paymentIntents.create({
        metadata,
        amount: Number(amount).toFixed(2) * 100,
        currency: 'usd',
        payment_method_types: ['card'],
        customer,
    });
};

const getPaymentIntent = async (paymentIntent) => {
    const instance = await getStripeInstance();
    return instance.paymentIntents.retrieve(paymentIntent);
};

// Webhooks wrapper for signature verification
// Since webhooks.constructEvent needs synchronous access, we create a wrapper
const webhooks = {
    constructEvent: async (payload, signature, secret) => {
        const instance = await getStripeInstance();
        return instance.webhooks.constructEvent(payload, signature, secret);
    }
};

// Export stripe instance and functions for backward compatibility
module.exports = {
    getCountryCode,
    getCustomer,
    createCustomer,
    createEphemeralKey,
    createpaymentIntent,
    getPaymentIntent,
    getStripeInstance, // Export function to get instance
    webhooks // Export webhooks wrapper for signature verification
};
