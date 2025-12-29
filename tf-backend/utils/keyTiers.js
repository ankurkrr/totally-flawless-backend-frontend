/**
 * Key Tier Configuration
 * 
 * Defines rotation strategies based on key risk tiers:
 * - Tier 1: High risk - MUST rotate frequently (60-180 days)
 * - Tier 2: Medium risk - SHOULD rotate (180-365 days)
 * - Tier 3: Low risk - Rotate rarely (6-12 months)
 */

const KEY_TIERS = {
    // Tier 1 - HIGH RISK: Rotate frequently (60-180 days)
    tier1: {
        jwt: {
            rotationIntervalDays: 90,
            gracePeriodDays: 7, // Keep old key active for token validation
            supportsMultipleActive: true, // Can have multiple active keys during grace period
            autoRotate: true,
            description: 'JWT Signing Secret - If leaked, attacker can mint valid tokens'
        },
        jwt_admin: {
            rotationIntervalDays: 90,
            gracePeriodDays: 7,
            supportsMultipleActive: true,
            autoRotate: true,
            description: 'Admin JWT Secret - Same as JWT but for admin endpoints'
        },
        stripe_webhook: {
            rotationIntervalDays: 180,
            gracePeriodDays: 0, // Stripe handles multiple webhook secrets
            supportsMultipleActive: true, // Stripe allows multiple active webhook secrets
            autoRotate: true,
            description: 'Stripe Webhook Signing Secret - Prevent forged webhook calls'
        },
        twilio_auth_token: {
            rotationIntervalDays: 90,
            gracePeriodDays: 0,
            supportsMultipleActive: false,
            autoRotate: true,
            description: 'Twilio Auth Token - Can be abused to send SMS (cost + spam)'
        },
        firebase_private_key: {
            rotationIntervalDays: 180,
            gracePeriodDays: 0,
            supportsMultipleActive: true, // Google supports multiple active keys
            autoRotate: true,
            description: 'Firebase Service Account Private Key - Long-lived, high privilege'
        }
    },

    // Tier 2 - MEDIUM RISK: Rotate periodically (180-365 days)
    tier2: {
        stripe_secret: {
            rotationIntervalDays: 180,
            gracePeriodDays: 0,
            supportsMultipleActive: false,
            autoRotate: true,
            description: 'Stripe Secret API Key - Used for payment operations'
        },
        aws_access_key_id: {
            rotationIntervalDays: 90,
            gracePeriodDays: 0,
            supportsMultipleActive: false,
            autoRotate: true,
            description: 'AWS Access Key ID - Prefer IAM Roles if on AWS'
        },
        aws_secret_access_key: {
            rotationIntervalDays: 90,
            gracePeriodDays: 0,
            supportsMultipleActive: false,
            autoRotate: true,
            description: 'AWS Secret Access Key - Prefer IAM Roles if on AWS'
        },
        google_maps: {
            rotationIntervalDays: 270, // ~9 months
            gracePeriodDays: 0,
            supportsMultipleActive: false,
            autoRotate: true,
            description: 'Google Maps API Key - Used for geocoding/proximity search'
        }
    },

    // Tier 3 - LOW RISK: Rotate rarely (6-12 months)
    tier3: {
        database_password: {
            rotationIntervalDays: 365, // 1 year
            gracePeriodDays: 0,
            supportsMultipleActive: false,
            autoRotate: false, // Manual rotation only - infra-sensitive
            description: 'Database Credentials - Rotate during infra changes or incidents'
        },
        twilio_account_sid: {
            rotationIntervalDays: 365,
            gracePeriodDays: 0,
            supportsMultipleActive: false,
            autoRotate: false,
            description: 'Twilio Account SID - Identifier, not a secret'
        },
        twilio_phone_number: {
            rotationIntervalDays: 365,
            gracePeriodDays: 0,
            supportsMultipleActive: false,
            autoRotate: false,
            description: 'Twilio Phone Number - Identifier, not a secret'
        }
    }
};

/**
 * Get tier configuration for a key type
 * @param {string} keyType - Type of key
 * @returns {Object|null} Tier configuration
 */
function getTierConfig(keyType) {
    for (const tier in KEY_TIERS) {
        if (KEY_TIERS[tier][keyType]) {
            return {
                tier,
                ...KEY_TIERS[tier][keyType]
            };
        }
    }
    return null;
}

/**
 * Get default rotation interval for a key type
 * @param {string} keyType - Type of key
 * @returns {number} Rotation interval in days
 */
function getDefaultRotationInterval(keyType) {
    const config = getTierConfig(keyType);
    return config ? config.rotationIntervalDays : 90; // Default 90 days
}

/**
 * Get default grace period for a key type
 * @param {string} keyType - Type of key
 * @returns {number} Grace period in days
 */
function getDefaultGracePeriod(keyType) {
    const config = getTierConfig(keyType);
    return config ? config.gracePeriodDays : 0;
}

/**
 * Check if key type supports multiple active keys
 * @param {string} keyType - Type of key
 * @returns {boolean} True if supports multiple active keys
 */
function supportsMultipleActive(keyType) {
    const config = getTierConfig(keyType);
    return config ? config.supportsMultipleActive : false;
}

/**
 * Check if key type should be auto-rotated
 * @param {string} keyType - Type of key
 * @returns {boolean} True if should auto-rotate
 */
function shouldAutoRotate(keyType) {
    const config = getTierConfig(keyType);
    return config ? config.autoRotate : true;
}

/**
 * Get tier for a key type
 * @param {string} keyType - Type of key
 * @returns {string} Tier (tier1, tier2, tier3)
 */
function getTier(keyType) {
    const config = getTierConfig(keyType);
    return config ? config.tier : 'tier2';
}

/**
 * Get all key types in a tier
 * @param {string} tier - Tier name (tier1, tier2, tier3)
 * @returns {Array} Array of key types
 */
function getKeyTypesInTier(tier) {
    return Object.keys(KEY_TIERS[tier] || {});
}

module.exports = {
    KEY_TIERS,
    getTierConfig,
    getDefaultRotationInterval,
    getDefaultGracePeriod,
    supportsMultipleActive,
    shouldAutoRotate,
    getTier,
    getKeyTypesInTier
};

