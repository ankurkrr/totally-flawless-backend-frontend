const KeyManagementService = require('../services/keyManagementService');

class KeyProvider {
    constructor() {
        this.cache = {};
        this.cacheTimeout = 60 * 60 * 1000; // 1 hour
    }

    /**
     * Get JWT secret (with caching)
     * Returns primary key, but can validate against all active keys during grace period
     */
    async getJWTSecret() {
        const cacheKey = 'jwt_secret';
        if (this.cache[cacheKey] && this.cache[cacheKey].expiresAt > Date.now()) {
            return this.cache[cacheKey].value;
        }

        let key;
        try {
            key = await KeyManagementService.getActiveKey('jwt');
        } catch (error) {
            // If database error (table doesn't exist, etc.), fallback to env var
            if (error.code === 'ER_NO_SUCH_TABLE' || error.message.includes("doesn't exist")) {
                console.warn('⚠️  Key Management System tables not found. Using JWT_SECRET from environment variables.');
                key = process.env.JWT_SECRET;
                if (!key) {
                    throw new Error('JWT_SECRET not found in environment variables. Please set JWT_SECRET in .env file.');
                }
            } else {
                throw error; // Re-throw other errors
            }
        }

        // Fallback to environment variable if key not found in database
        if (!key) {
            // Check if fallback is enabled OR if we're in development (always allow fallback)
            if (process.env.FALLBACK_TO_ENV_VARS === 'true' || process.env.NODE_ENV === 'development') {
                console.warn('⚠️  JWT secret not found in database. Using JWT_SECRET from environment variables.');
                key = process.env.JWT_SECRET;
                if (!key) {
                    throw new Error('JWT_SECRET not found in environment variables. Please set JWT_SECRET in .env file or set up Key Management System.');
                }
            } else {
                throw new Error('JWT secret not found. Please create one using the admin API or set FALLBACK_TO_ENV_VARS=true in .env');
            }
        }

        this.cache[cacheKey] = {
            value: key,
            expiresAt: Date.now() + this.cacheTimeout
        };

        return key;
    }

    /**
     * Get all active JWT secrets (for token validation during grace period)
     * @returns {Promise<string[]>} Array of all active JWT secrets
     */
    async getAllJWTSecrets() {
        const cacheKey = 'jwt_secrets_all';
        if (this.cache[cacheKey] && this.cache[cacheKey].expiresAt > Date.now()) {
            return this.cache[cacheKey].value;
        }

        let keys = [];
        try {
            keys = await KeyManagementService.getAllActiveKeys('jwt');
        } catch (error) {
            // If database error (table doesn't exist, etc.), fallback to env var
            if (error.code === 'ER_NO_SUCH_TABLE' || error.message.includes("doesn't exist")) {
                console.warn('⚠️  Key Management System tables not found. Using JWT_SECRET from environment variables.');
                const envSecret = process.env.JWT_SECRET;
                if (envSecret) {
                    keys = [envSecret];
                }
            }
        }

        // Fallback to single key if no keys found
        if (!keys || keys.length === 0) {
            try {
                // Fallback to single key (which has its own fallback logic)
                const singleKey = await this.getJWTSecret();
                keys = [singleKey];
            } catch (error) {
                // Final fallback - use env var directly
                const envSecret = process.env.JWT_SECRET;
                if (envSecret) {
                    console.warn('⚠️  Using JWT_SECRET directly from environment variables.');
                    keys = [envSecret];
                } else {
                    throw new Error('JWT_SECRET not found. Please set JWT_SECRET in .env file.');
                }
            }
        }

        this.cache[cacheKey] = {
            value: keys,
            expiresAt: Date.now() + this.cacheTimeout
        };

        return keys;
    }

    /**
     * Get Stripe secret key
     */
    async getStripeSecretKey() {
        const cacheKey = 'stripe_secret';
        if (this.cache[cacheKey] && this.cache[cacheKey].expiresAt > Date.now()) {
            return this.cache[cacheKey].value;
        }

        const key = await KeyManagementService.getActiveKey('stripe_secret');
        if (!key) {
            throw new Error('Stripe secret key not found.');
        }

        this.cache[cacheKey] = {
            value: key,
            expiresAt: Date.now() + this.cacheTimeout
        };

        return key;
    }

    /**
     * Get all active Stripe webhook secrets (Stripe supports multiple)
     * @returns {Promise<string[]>} Array of all active webhook secrets
     */
    async getAllStripeWebhookSecrets() {
        const cacheKey = 'stripe_webhook_secrets';
        if (this.cache[cacheKey] && this.cache[cacheKey].expiresAt > Date.now()) {
            return this.cache[cacheKey].value;
        }

        const keys = await KeyManagementService.getAllActiveKeys('stripe_webhook');
        if (!keys || keys.length === 0) {
            throw new Error('Stripe webhook secret not found.');
        }

        this.cache[cacheKey] = {
            value: keys,
            expiresAt: Date.now() + this.cacheTimeout
        };

        return keys;
    }

    /**
     * Get AWS credentials
     */
    async getAWSCredentials() {
        const cacheKey = 'aws_credentials';
        if (this.cache[cacheKey] && this.cache[cacheKey].expiresAt > Date.now()) {
            return this.cache[cacheKey].value;
        }

        let accessKeyId, secretAccessKey;
        
        try {
            accessKeyId = await KeyManagementService.getActiveKey('aws_access_key_id');
            secretAccessKey = await KeyManagementService.getActiveKey('aws_secret_access_key');
        } catch (error) {
            // If database error (table doesn't exist, etc.), fallback to env vars
            if (error.code === 'ER_NO_SUCH_TABLE' || error.message.includes("doesn't exist")) {
                console.warn('⚠️  Key Management System tables not found. Using AWS credentials from environment variables.');
                accessKeyId = process.env.AWS_ACCESS_KEY_ID;
                secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
            } else {
                throw error; // Re-throw other errors
            }
        }
        
        // Fallback to environment variables if keys not found in database
        if (!accessKeyId || !secretAccessKey) {
            // Always try to use environment variables as fallback
            console.warn('⚠️  AWS credentials not found in database. Using AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY from environment variables.');
            accessKeyId = process.env.AWS_ACCESS_KEY_ID;
            secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
            
            if (!accessKeyId || !secretAccessKey) {
                throw new Error('AWS credentials not found in environment variables. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env file or set up Key Management System.');
            }
        }

        const credentials = {
            accessKeyId,
            secretAccessKey
        };

        this.cache[cacheKey] = {
            value: credentials,
            expiresAt: Date.now() + this.cacheTimeout
        };

        return credentials;
    }

    /**
     * Get Google Maps API key
     */
    async getGoogleMapsAPIKey() {
        const cacheKey = 'google_maps_api';
        if (this.cache[cacheKey] && this.cache[cacheKey].expiresAt > Date.now()) {
            return this.cache[cacheKey].value;
        }

        const key = await KeyManagementService.getActiveKey('google_maps');
        if (!key) {
            throw new Error('Google Maps API key not found.');
        }

        this.cache[cacheKey] = {
            value: key,
            expiresAt: Date.now() + this.cacheTimeout
        };

        return key;
    }

    /**
     * Get Twilio credentials
     */
    async getTwilioCredentials() {
        const cacheKey = 'twilio_credentials';
        if (this.cache[cacheKey] && this.cache[cacheKey].expiresAt > Date.now()) {
            return this.cache[cacheKey].value;
        }

        const accountSid = await KeyManagementService.getActiveKey('twilio_account_sid');
        const authToken = await KeyManagementService.getActiveKey('twilio_auth_token');
        const phoneNumber = await KeyManagementService.getActiveKey('twilio_phone_number');

        if (!accountSid || !authToken || !phoneNumber) {
            throw new Error('Twilio credentials not found.');
        }

        const credentials = {
            accountSid,
            authToken,
            phoneNumber
        };

        this.cache[cacheKey] = {
            value: credentials,
            expiresAt: Date.now() + this.cacheTimeout
        };

        return credentials;
    }

    /**
     * Clear cache (useful after key rotation)
     */
    clearCache() {
        this.cache = {};
    }
}

// Export singleton instance
module.exports = new KeyProvider();

