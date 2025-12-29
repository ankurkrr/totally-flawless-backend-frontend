/**
 * @fileoverview Environment Variable Validator
 * @description Validates required environment variables on startup
 * @module utils/envValidator
 */

const logger = require('./logger');

/**
 * Required environment variables by category
 */
const REQUIRED_ENV_VARS = {
    database: ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'],
    jwt: ['JWT_SECRET'],
    stripe: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
    aws: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'S3_BUCKET_NAME'],
    twilio: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'],
    firebase: ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL'],
};

/**
 * Optional but recommended environment variables
 */
const RECOMMENDED_ENV_VARS = {
    server: ['PORT', 'NODE_ENV'],
    google: ['GOOGLE_MAPS_API_KEY'],
    mail: ['MAIL_USER', 'MAIL_PASSWORD'],
};

/**
 * Validate environment variables
 * @param {boolean} strict - If true, throws error on missing required vars. If false, only warns.
 * @returns {Object} Validation result
 */
function validateEnv(strict = true) {
    const missing = {};
    const warnings = [];

    // Check required variables
    for (const [category, vars] of Object.entries(REQUIRED_ENV_VARS)) {
        const missingInCategory = vars.filter(varName => !process.env[varName]);
        if (missingInCategory.length > 0) {
            missing[category] = missingInCategory;
        }
    }

    // Check recommended variables
    for (const [category, vars] of Object.entries(RECOMMENDED_ENV_VARS)) {
        const missingInCategory = vars.filter(varName => !process.env[varName]);
        if (missingInCategory.length > 0) {
            warnings.push({
                category,
                vars: missingInCategory,
            });
        }
    }

    // Log results
    if (Object.keys(missing).length > 0) {
        logger.error('❌ Missing required environment variables:');
        for (const [category, vars] of Object.entries(missing)) {
            logger.error(`   ${category.toUpperCase()}: ${vars.join(', ')}`);
        }

        if (strict) {
            throw new Error('Missing required environment variables. Please check your .env file.');
        }
    } else {
        logger.info('✅ All required environment variables are set');
    }

    if (warnings.length > 0) {
        logger.warn('⚠️  Missing recommended environment variables:');
        for (const warning of warnings) {
            logger.warn(`   ${warning.category.toUpperCase()}: ${warning.vars.join(', ')}`);
        }
    }

    return {
        valid: Object.keys(missing).length === 0,
        missing,
        warnings,
    };
}

/**
 * Validate specific environment variable
 * @param {string} varName - Environment variable name
 * @param {boolean} required - Whether the variable is required
 * @returns {boolean} Whether the variable is set
 */
function validateVar(varName, required = true) {
    const isSet = !!process.env[varName];
    if (required && !isSet) {
        logger.error(`❌ Required environment variable ${varName} is not set`);
        return false;
    } else if (!required && !isSet) {
        logger.warn(`⚠️  Recommended environment variable ${varName} is not set`);
    }
    return isSet;
}

module.exports = {
    validateEnv,
    validateVar,
    REQUIRED_ENV_VARS,
    RECOMMENDED_ENV_VARS,
};

