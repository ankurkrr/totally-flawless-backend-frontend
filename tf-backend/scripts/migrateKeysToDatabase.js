/**
 * Migration Script: Migrate keys from environment variables to database
 * 
 * This script reads keys from environment variables and stores them
 * encrypted in the database for use with the Key Management System.
 * 
 * Usage: node scripts/migrateKeysToDatabase.js
 */

require('dotenv').config();
const KeyManagementService = require('../services/keyManagementService');
const db = require('../connection/knexdatabase');
const { v4: uuidv4 } = require('uuid');

async function migrateKeys() {
    console.log('🔄 Migrating keys from environment variables to database...\n');

    // Check if master encryption key is set
    if (!process.env.MASTER_ENCRYPTION_KEY) {
        console.error('❌ MASTER_ENCRYPTION_KEY not found in environment variables!');
        console.error('   Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
        process.exit(1);
    }

    const keysToMigrate = [
        {
            keyName: 'JWT Secret (Production)',
            keyType: 'jwt',
            environment: 'production',
            keyValue: process.env.JWT_SECRET
        },
        {
            keyName: 'JWT Secret (Development)',
            keyType: 'jwt',
            environment: 'development',
            keyValue: process.env.JWT_SECRET // Can be same or different
        },
        {
            keyName: 'Stripe Secret Key (Production)',
            keyType: 'stripe',
            environment: 'production',
            keyValue: process.env.STRIPE_SECRET_KEY
        },
        {
            keyName: 'Stripe Secret Key (Development)',
            keyType: 'stripe',
            environment: 'development',
            keyValue: process.env.STRIPE_SECRET_KEY
        },
        {
            keyName: 'Google Maps API Key (Production)',
            keyType: 'google_maps',
            environment: 'production',
            keyValue: process.env.GOOGLE_MAPS_API_KEY
        },
        {
            keyName: 'Google Maps API Key (Development)',
            keyType: 'google_maps',
            environment: 'development',
            keyValue: process.env.GOOGLE_MAPS_API_KEY
        },
        {
            keyName: 'AWS Access Key ID (Production)',
            keyType: 'aws_access_key_id',
            environment: 'production',
            keyValue: process.env.AWS_ACCESS_KEY_ID
        },
        {
            keyName: 'AWS Secret Access Key (Production)',
            keyType: 'aws_secret_access_key',
            environment: 'production',
            keyValue: process.env.AWS_SECRET_ACCESS_KEY
        },
        {
            keyName: 'Twilio Account SID (Production)',
            keyType: 'twilio_account_sid',
            environment: 'production',
            keyValue: process.env.TWILIO_ACCOUNT_SID
        },
        {
            keyName: 'Twilio Auth Token (Production)',
            keyType: 'twilio_auth_token',
            environment: 'production',
            keyValue: process.env.TWILIO_AUTH_TOKEN
        },
        {
            keyName: 'Twilio Phone Number (Production)',
            keyType: 'twilio_phone_number',
            environment: 'production',
            keyValue: process.env.TWILIO_PHONE_NUMBER
        }
    ];

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const keyInfo of keysToMigrate) {
        if (!keyInfo.keyValue) {
            console.log(`⏭️  Skipping ${keyInfo.keyName} - not found in environment variables`);
            skipped++;
            continue;
        }

        try {
            // Check if key already exists
            const existing = await db('api_keys')
                .where({
                    key_type: keyInfo.keyType,
                    environment: keyInfo.environment
                })
                .first();

            if (existing) {
                console.log(`⏭️  Skipping ${keyInfo.keyName} - already exists in database`);
                skipped++;
                continue;
            }

            // Create key record manually with existing value
            const keyId = uuidv4();
            const keyHash = KeyManagementService.hashKey(keyInfo.keyValue);
            const masterKey = process.env.MASTER_ENCRYPTION_KEY;
            const encryptedKey = KeyManagementService.encryptKey(keyInfo.keyValue, masterKey);

            await db('api_keys').insert({
                id: keyId,
                key_name: keyInfo.keyName,
                key_type: keyInfo.keyType,
                key_value: encryptedKey,
                key_hash: keyHash,
                environment: keyInfo.environment,
                is_active: true,
                rotation_interval_days: 90
            });

            console.log(`✅ Migrated ${keyInfo.keyName} (${keyInfo.environment})`);
            migrated++;
        } catch (error) {
            console.error(`❌ Failed to migrate ${keyInfo.keyName}:`, error.message);
            errors++;
        }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Migrated: ${migrated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);

    if (migrated > 0) {
        console.log('\n✅ Migration completed!');
        console.log('   You can now use the Key Management System.');
        console.log('   Set FALLBACK_TO_ENV_VARS=false in .env to disable fallback.');
    } else {
        console.log('\n⚠️  No keys were migrated. Check your environment variables.');
    }

    process.exit(errors > 0 ? 1 : 0);
}

// Run migration
migrateKeys().catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
});

