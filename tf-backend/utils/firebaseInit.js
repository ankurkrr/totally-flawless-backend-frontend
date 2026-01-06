/**
 * Firebase Admin SDK Initialization
 * 
 * This module initializes Firebase Admin SDK using environment variables
 * instead of hardcoded JSON files for better security.
 * 
 * Firebase is REQUIRED for push notifications - the app will fail to start
 * if Firebase credentials are not properly configured.
 * 
 * Usage:
 *   const admin = require('./utils/firebaseInit');
 *   // admin is now initialized and ready to use
 */

require('dotenv').config();
const admin = require('firebase-admin');

/**
 * Local-dev friendly behavior:
 * - In production, Firebase credentials are required and missing creds should fail fast.
 * - In non-production (development/test), allow booting without Firebase creds by returning
 *   a lightweight stub so the API can run for endpoint testing without notifications.
 */

function isFirebaseConfigured() {
    return !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL);
}

function shouldRequireFirebase() {
    // Explicit override (useful in CI/containers)
    if (process.env.REQUIRE_FIREBASE === 'true') return true;
    if (process.env.DISABLE_FIREBASE === 'true') return false;
    return process.env.NODE_ENV === 'production';
}

function createFirebaseDisabledStub() {
    const disabledError = new Error('Firebase is disabled or not configured for this environment');
    return {
        apps: [],
        // Keep shape similar to firebase-admin for call sites
        messaging() {
            return {
                async send() {
                    // mimic successful send without actually doing anything
                    return 'firebase-disabled';
                },
                async sendMulticast(message) {
                    const tokens = message?.tokens || [];
                    return {
                        successCount: 0,
                        failureCount: tokens.length,
                        responses: tokens.map(() => ({ success: false, error: disabledError })),
                    };
                },
                async sendEachForMulticast(message) {
                    const tokens = message?.tokens || [];
                    return {
                        successCount: 0,
                        failureCount: tokens.length,
                        responses: tokens.map(() => ({ success: false, error: disabledError })),
                    };
                },
            };
        },
    };
}

// If Firebase is not required and not configured, export a stub so the server can boot.
if (!isFirebaseConfigured() && !shouldRequireFirebase()) {
    console.warn('⚠️  Firebase not configured. Continuing without Firebase (notifications disabled).');
    module.exports = createFirebaseDisabledStub();
    return;
}

// Check if Firebase is already initialized to avoid re-initialization errors
if (!admin.apps.length) {
    // Get Firebase credentials from environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKeyId = process.env.FIREBASE_PRIVATE_KEY_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const clientId = process.env.FIREBASE_CLIENT_ID;
    const authUri = process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth';
    const tokenUri = process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token';
    const authProviderX509CertUrl = process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs';
    const clientX509CertUrl = process.env.FIREBASE_CLIENT_X509_CERT_URL;

    // Validate required environment variables
    if (!projectId || !privateKey || !clientEmail) {
        console.error('❌ Firebase credentials are REQUIRED but not found in environment variables.');
        console.error('   Required variables:');
        console.error('     - FIREBASE_PROJECT_ID');
        console.error('     - FIREBASE_PRIVATE_KEY');
        console.error('     - FIREBASE_CLIENT_EMAIL');
        console.error('   Optional variables:');
        console.error('     - FIREBASE_PRIVATE_KEY_ID');
        console.error('     - FIREBASE_CLIENT_ID');
        console.error('');
        console.error('   Please add Firebase credentials to your .env file.');
        console.error('   See env.example and docs/FIREBASE_SETUP.md for configuration details.');
        console.error('');
        throw new Error('Firebase credentials are required. Please configure FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL in your .env file.');
    }

    try {
        // Build service account object from environment variables
        const serviceAccount = {
            type: 'service_account',
            project_id: projectId,
            private_key_id: privateKeyId,
            private_key: privateKey,
            client_email: clientEmail,
            client_id: clientId,
            auth_uri: authUri,
            token_uri: tokenUri,
            auth_provider_x509_cert_url: authProviderX509CertUrl,
            client_x509_cert_url: clientX509CertUrl,
        };

        // Initialize Firebase Admin SDK
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });

        console.log('✅ Firebase Admin SDK initialized successfully');
        console.log(`   Project ID: ${projectId}`);
    } catch (error) {
        console.error('❌ Error initializing Firebase Admin SDK:', error.message);
        console.error('');
        console.error('   Please check your Firebase environment variables in .env file:');
        console.error('   - Verify FIREBASE_PRIVATE_KEY format (should include \\n for newlines)');
        console.error('   - Ensure all required fields are set correctly');
        console.error('   - See docs/FIREBASE_SETUP.md for detailed instructions');
        console.error('');
        throw new Error(`Failed to initialize Firebase: ${error.message}`);
    }
} else {
    console.log('✅ Firebase Admin SDK already initialized');
}

// Export admin instance - Firebase is required, so this should always be available
module.exports = admin;

