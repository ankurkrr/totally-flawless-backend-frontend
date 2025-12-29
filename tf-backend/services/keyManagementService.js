const crypto = require('crypto');
const db = require('../connection/knexdatabase');
const { v4: uuidv4 } = require('uuid');
const {
    getTierConfig,
    getDefaultRotationInterval,
    getDefaultGracePeriod,
    supportsMultipleActive,
    shouldAutoRotate,
    getTier
} = require('../utils/keyTiers');

class KeyManagementService {
    /**
     * Generate a secure random key
     * @param {number} length - Key length in bytes
     * @param {string} encoding - Encoding format (hex, base64)
     * @returns {string} Generated key
     */
    static generateKey(length = 32, encoding = 'hex') {
        return crypto.randomBytes(length).toString(encoding);
    }

    /**
     * Generate JWT secret
     * @returns {string} 64-character hex string
     */
    static generateJWTSecret() {
        return this.generateKey(32, 'hex');
    }

    /**
     * Generate API key with prefix
     * @param {string} prefix - Key prefix (e.g., 'sk_live_', 'pk_test_')
     * @param {number} length - Random part length
     * @returns {string} Generated API key
     */
    static generateAPIKey(prefix = '', length = 32) {
        const randomPart = this.generateKey(Math.ceil(length * 0.75), 'base64')
            .replace(/[+/=]/g, '') // Remove special chars for URL safety
            .substring(0, length);
        return prefix + randomPart;
    }

    /**
     * Hash a key for storage (one-way hash for validation)
     * @param {string} key - Key to hash
     * @returns {string} Hashed key
     */
    static hashKey(key) {
        return crypto.createHash('sha256').update(key).digest('hex');
    }

    /**
     * Encrypt a key for storage
     * @param {string} key - Key to encrypt
     * @param {string} encryptionKey - Master encryption key from env
     * @returns {string} Encrypted key
     */
    static encryptKey(key, encryptionKey) {
        if (!encryptionKey) {
            throw new Error('Encryption key is required');
        }

        try {
            const algorithm = 'aes-256-gcm';
            const keyBuffer = Buffer.from(encryptionKey, 'hex');
            
            // Ensure key is 32 bytes for AES-256
            const finalKey = keyBuffer.length === 32 
                ? keyBuffer 
                : crypto.createHash('sha256').update(encryptionKey).digest();
            
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(algorithm, finalKey, iv);
            
            let encrypted = cipher.update(key, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const authTag = cipher.getAuthTag();
            
            // Return IV + AuthTag + Encrypted data
            return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
        } catch (error) {
            throw new Error(`Encryption failed: ${error.message}`);
        }
    }

    /**
     * Decrypt a key
     * @param {string} encryptedKey - Encrypted key
     * @param {string} encryptionKey - Master encryption key from env
     * @returns {string} Decrypted key
     */
    static decryptKey(encryptedKey, encryptionKey) {
        if (!encryptionKey) {
            throw new Error('Encryption key is required');
        }

        try {
            const algorithm = 'aes-256-gcm';
            const parts = encryptedKey.split(':');
            
            if (parts.length !== 3) {
                throw new Error('Invalid encrypted key format');
            }

            const keyBuffer = Buffer.from(encryptionKey, 'hex');
            const finalKey = keyBuffer.length === 32 
                ? keyBuffer 
                : crypto.createHash('sha256').update(encryptionKey).digest();
            
            const iv = Buffer.from(parts[0], 'hex');
            const authTag = Buffer.from(parts[1], 'hex');
            const encrypted = parts[2];
            
            const decipher = crypto.createDecipheriv(algorithm, finalKey, iv);
            decipher.setAuthTag(authTag);
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            throw new Error(`Decryption failed: ${error.message}`);
        }
    }

    /**
     * Create a new API key
     * @param {Object} options - Key creation options
     * @returns {Promise<Object>} Created key info (with actual key value)
     */
    static async createKey(options) {
        const {
            keyName,
            keyType,
            environment = 'development',
            expiresInDays = null,
            rotationIntervalDays = null, // Will use tier default if not provided
            gracePeriodDays = null, // Will use tier default if not provided
            createdBy = null,
            metadata = {},
            customKeyValue = null, // Allow setting custom key value
            isPrimary = true // Primary key for this type/env
        } = options;

        // ⚠️ CRITICAL: Master encryption key should NEVER be stored in database
        if (keyType === 'master_encryption_key') {
            throw new Error('Master encryption key MUST NOT be stored in database. Store in AWS Secrets Manager, HashiCorp Vault, or GCP Secret Manager.');
        }

        // Get tier configuration
        const tierConfig = getTierConfig(keyType);
        const tier = tierConfig ? tierConfig.tier : 'tier2';
        const defaultRotationInterval = rotationIntervalDays || getDefaultRotationInterval(keyType);
        const defaultGracePeriod = gracePeriodDays !== null ? gracePeriodDays : getDefaultGracePeriod(keyType);

        // Generate key based on type or use custom value
        let keyValue;
        if (customKeyValue) {
            keyValue = customKeyValue;
        } else {
            switch (keyType) {
                case 'jwt':
                case 'jwt_admin':
                    keyValue = this.generateJWTSecret();
                    break;
                case 'stripe_secret':
                    keyValue = this.generateAPIKey('sk_test_', 32);
                    break;
                case 'stripe_webhook':
                    keyValue = this.generateAPIKey('whsec_', 32);
                    break;
                case 'aws_access_key_id':
                    keyValue = this.generateAPIKey('AKIA', 16);
                    break;
                case 'aws_secret_access_key':
                    keyValue = this.generateKey(40, 'base64');
                    break;
                case 'google_maps':
                    keyValue = this.generateAPIKey('AIza', 35);
                    break;
                case 'twilio_auth_token':
                    keyValue = this.generateKey(32, 'hex');
                    break;
                case 'firebase_private_key':
                    // Firebase private keys are JSON - this is a placeholder
                    // Actual keys should be imported from Firebase console
                    keyValue = customKeyValue || this.generateKey(64, 'base64');
                    break;
                default:
                    keyValue = this.generateKey(32, 'hex');
            }
        }

        const keyId = uuidv4();
        const keyHash = this.hashKey(keyValue);
        
        // Get master encryption key from environment
        const masterKey = process.env.MASTER_ENCRYPTION_KEY;
        if (!masterKey) {
            throw new Error('MASTER_ENCRYPTION_KEY not configured in environment variables');
        }

        const encryptedKey = this.encryptKey(keyValue, masterKey);

        const expiresAt = expiresInDays 
            ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
            : null;

        // If this is a primary key and there's already a primary, mark old one as non-primary
        if (isPrimary && supportsMultipleActive(keyType)) {
            // Keep old keys active (for grace period)
        } else if (isPrimary && !supportsMultipleActive(keyType)) {
            // Deactivate old primary key
            await db('api_keys')
                .where({
                    key_type: keyType,
                    environment: environment,
                    is_primary: true,
                    is_active: true
                })
                .update({ is_primary: false });
        }

        await db('api_keys').insert({
            id: keyId,
            key_name: keyName,
            key_type: keyType,
            key_value: encryptedKey,
            key_hash: keyHash,
            environment: environment,
            tier: tier,
            is_primary: isPrimary,
            expires_at: expiresAt,
            rotation_interval_days: defaultRotationInterval,
            grace_period_days: defaultGracePeriod,
            created_by: createdBy,
            metadata: JSON.stringify(metadata)
        });

        // Return key info (actual key only returned once on creation)
        return {
            id: keyId,
            keyName,
            keyType,
            tier,
            keyValue, // Only returned on creation
            environment,
            expiresAt,
            rotationIntervalDays: defaultRotationInterval,
            gracePeriodDays: defaultGracePeriod,
            createdAt: new Date()
        };
    }

    /**
     * Retrieve a key by ID (decrypted)
     * @param {string} keyId - Key ID
     * @returns {Promise<string|null>} Decrypted key value
     */
    static async getKey(keyId) {
        const keyRecord = await db('api_keys')
            .where({ id: keyId, is_active: true })
            .first();

        if (!keyRecord) {
            return null;
        }

        // Check expiration
        if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
            throw new Error('Key has expired');
        }

        // Decrypt key
        const masterKey = process.env.MASTER_ENCRYPTION_KEY;
        if (!masterKey) {
            throw new Error('MASTER_ENCRYPTION_KEY not configured');
        }

        const decryptedKey = this.decryptKey(keyRecord.key_value, masterKey);

        // Update usage stats
        await db('api_keys')
            .where({ id: keyId })
            .update({
                last_used_at: db.raw('NOW()'),
                usage_count: db.raw('usage_count + 1')
            });

        return decryptedKey;
    }

    /**
     * Get active key(s) by type and environment
     * For keys that support multiple active (JWT, webhooks), returns all active keys
     * For others, returns the primary active key
     * @param {string} keyType - Type of key
     * @param {string} environment - Environment name
     * @param {boolean} returnAll - If true, return all active keys (for grace period support)
     * @returns {Promise<string|string[]|null>} Decrypted key value(s)
     */
    static async getActiveKey(keyType, environment = null, returnAll = false) {
        const env = environment || process.env.NODE_ENV || 'development';
        const supportsMultiple = supportsMultipleActive(keyType);
        
        let query = db('api_keys')
            .where({
                key_type: keyType,
                environment: env,
                is_active: true
            })
            .where(function() {
                this.whereNull('expires_at')
                    .orWhere('expires_at', '>', db.raw('NOW()'));
            });

        if (supportsMultiple && returnAll) {
            // Return all active keys (for JWT grace period, Stripe webhooks)
            query = query.orderBy('created_at', 'desc');
        } else {
            // Return primary key only
            query = query.where('is_primary', true).orderBy('created_at', 'desc').first();
        }

        const keyRecords = supportsMultiple && returnAll ? await query : [await query];

        if (!keyRecords || keyRecords.length === 0 || (keyRecords.length === 1 && !keyRecords[0])) {
            // Fallback to environment variable if enabled OR in development mode
            // Always allow fallback if FALLBACK_TO_ENV_VARS is true, or if in development, or if env var exists
            const allowFallback = process.env.FALLBACK_TO_ENV_VARS === 'true' || 
                                 process.env.NODE_ENV === 'development' ||
                                 process.env.NODE_ENV !== 'production';
            
            if (allowFallback) {
                const envKeyMap = {
                    'jwt': 'JWT_SECRET',
                    'jwt_admin': 'JWT_SECRET',
                    'stripe_secret': 'STRIPE_SECRET_KEY',
                    'stripe_webhook': 'STRIPE_WEBHOOK_SECRET',
                    'google_maps': 'GOOGLE_MAPS_API_KEY',
                    'aws_access_key_id': 'AWS_ACCESS_KEY_ID',
                    'aws_secret_access_key': 'AWS_SECRET_ACCESS_KEY',
                    'twilio_auth_token': 'TWILIO_AUTH_TOKEN',
                    'twilio_account_sid': 'TWILIO_ACCOUNT_SID',
                    'twilio_phone_number': 'TWILIO_PHONE_NUMBER'
                };
                
                const envVarName = envKeyMap[keyType];
                if (envVarName && process.env[envVarName]) {
                    console.warn(`⚠️  Key ${keyType} not found in database, using environment variable ${envVarName}`);
                    return process.env[envVarName];
                }
            }
            return null;
        }

        // Decrypt and return keys
        const masterKey = process.env.MASTER_ENCRYPTION_KEY;
        if (!masterKey) {
            throw new Error('MASTER_ENCRYPTION_KEY not configured');
        }

        const decryptedKeys = await Promise.all(
            keyRecords.map(async (record) => {
                const decrypted = this.decryptKey(record.key_value, masterKey);
                
                // Update usage stats
                await db('api_keys')
                    .where({ id: record.id })
                    .update({
                        last_used_at: db.raw('NOW()'),
                        usage_count: db.raw('usage_count + 1')
                    });
                
                return decrypted;
            })
        );

        // Return array if multiple keys requested, single value otherwise
        if (supportsMultiple && returnAll) {
            return decryptedKeys;
        }
        return decryptedKeys[0];
    }

    /**
     * Get all active keys for a type (useful for JWT grace period, Stripe webhooks)
     * @param {string} keyType - Type of key
     * @param {string} environment - Environment name
     * @returns {Promise<string[]>} Array of decrypted key values
     */
    static async getAllActiveKeys(keyType, environment = null) {
        return this.getActiveKey(keyType, environment, true) || [];
    }

    /**
     * Rotate a key with tier-based strategy
     * @param {string} keyId - Key ID to rotate
     * @param {string} rotatedBy - User ID performing rotation
     * @param {string} reason - Reason for rotation
     * @returns {Promise<Object>} New key info
     */
    static async rotateKey(keyId, rotatedBy = null, reason = 'Scheduled rotation') {
        const oldKey = await db('api_keys').where({ id: keyId }).first();
        if (!oldKey) {
            throw new Error('Key not found');
        }

        // Check if auto-rotation is enabled for this key type
        if (!shouldAutoRotate(oldKey.key_type) && rotatedBy === 'system') {
            throw new Error(`Key type ${oldKey.key_type} does not support automatic rotation. Manual rotation required.`);
        }

        const tierConfig = getTierConfig(oldKey.key_type);
        const supportsMultiple = supportsMultipleActive(oldKey.key_type);
        const gracePeriodDays = oldKey.grace_period_days || getDefaultGracePeriod(oldKey.key_type);

        // Generate new key based on type
        let newKeyValue;
        switch (oldKey.key_type) {
            case 'jwt':
            case 'jwt_admin':
                newKeyValue = this.generateJWTSecret();
                break;
            case 'stripe_secret':
                newKeyValue = this.generateAPIKey('sk_test_', 32);
                break;
            case 'stripe_webhook':
                newKeyValue = this.generateAPIKey('whsec_', 32);
                break;
            case 'aws_access_key_id':
                newKeyValue = this.generateAPIKey('AKIA', 16);
                break;
            case 'aws_secret_access_key':
                newKeyValue = this.generateKey(40, 'base64');
                break;
            case 'google_maps':
                newKeyValue = this.generateAPIKey('AIza', 35);
                break;
            case 'twilio_auth_token':
                newKeyValue = this.generateKey(32, 'hex');
                break;
            case 'firebase_private_key':
                newKeyValue = this.generateKey(64, 'base64');
                break;
            default:
                newKeyValue = this.generateKey(32, 'hex');
        }

        const newKeyHash = this.hashKey(newKeyValue);
        const masterKey = process.env.MASTER_ENCRYPTION_KEY;
        if (!masterKey) {
            throw new Error('MASTER_ENCRYPTION_KEY not configured');
        }

        const encryptedNewKey = this.encryptKey(newKeyValue, masterKey);

        // Create new key record (keeping old one active during grace period if supported)
        const newKeyId = uuidv4();
        await db('api_keys').insert({
            id: newKeyId,
            key_name: `${oldKey.key_name} (Rotated)`,
            key_type: oldKey.key_type,
            key_value: encryptedNewKey,
            key_hash: newKeyHash,
            environment: oldKey.environment,
            tier: oldKey.tier,
            is_primary: true, // New key becomes primary
            is_active: true,
            rotation_interval_days: oldKey.rotation_interval_days,
            grace_period_days: gracePeriodDays,
            created_by: rotatedBy,
            metadata: oldKey.metadata
        });

        // If supports multiple active keys, keep old key active during grace period
        if (supportsMultiple && gracePeriodDays > 0) {
            // Mark old key as non-primary but keep active
            await db('api_keys')
                .where({ id: keyId })
                .update({
                    is_primary: false,
                    rotated_at: db.raw('NOW()'),
                    updated_at: db.raw('NOW()'),
                    expires_at: db.raw(`DATE_ADD(NOW(), INTERVAL ${gracePeriodDays} DAY)`)
                });
        } else {
            // Deactivate old key immediately
            await db('api_keys')
                .where({ id: keyId })
                .update({
                    is_active: false,
                    is_primary: false,
                    rotated_at: db.raw('NOW()'),
                    updated_at: db.raw('NOW()')
                });
        }

        // Log rotation
        await db('key_rotation_history').insert({
            id: uuidv4(),
            key_id: newKeyId,
            old_key_hash: oldKey.key_hash,
            new_key_hash: newKeyHash,
            rotated_by: rotatedBy,
            rotation_reason: reason
        });

        return {
            id: newKeyId,
            oldKeyId: keyId,
            keyValue: newKeyValue, // Only returned on rotation
            rotatedAt: new Date(),
            gracePeriodDays: supportsMultiple ? gracePeriodDays : 0,
            oldKeyActive: supportsMultiple && gracePeriodDays > 0
        };
    }

    /**
     * Log key usage
     * @param {string} keyId - Key ID
     * @param {Object} usageInfo - Usage information
     */
    static async logUsage(keyId, usageInfo) {
        const {
            serviceName,
            endpoint = null,
            ipAddress = null,
            userAgent = null,
            success = true,
            errorMessage = null
        } = usageInfo;

        try {
            await db('key_usage_logs').insert({
                id: uuidv4(),
                key_id: keyId,
                service_name: serviceName,
                endpoint,
                ip_address: ipAddress,
                user_agent: userAgent,
                success,
                error_message: errorMessage,
                used_at: db.raw('NOW()')
            });
        } catch (error) {
            // Don't throw - logging is non-critical
            console.error('Failed to log key usage:', error.message);
        }
    }
}

module.exports = KeyManagementService;

