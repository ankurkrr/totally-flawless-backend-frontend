/**
 * Tier-Based Key Rotation Cron Jobs
 * 
 * Automatically rotates keys based on their tier and rotation intervals:
 * - Tier 1: High risk keys (60-180 days)
 * - Tier 2: Medium risk keys (180-365 days)
 * - Tier 3: Low risk keys (manual rotation only)
 */

const cron = require('node-cron');
const KeyManagementService = require('../services/keyManagementService');
const { shouldAutoRotate, getKeyTypesInTier } = require('../utils/keyTiers');
const db = require('../connection/knexdatabase');

/**
 * Rotate keys that are due for rotation
 * Runs daily at 2 AM
 */
cron.schedule('0 2 * * *', async () => {
    console.log('🔄 Starting scheduled key rotation check...');

    try {
        // Find keys that need rotation (only auto-rotatable ones)
        const keysToRotate = await db('api_keys')
            .where({ is_active: true })
            .where(function() {
                this.whereNull('rotated_at')
                    .orWhereRaw('DATEDIFF(NOW(), rotated_at) >= rotation_interval_days');
            })
            .whereRaw('(expires_at IS NULL OR expires_at > NOW())');

        let rotated = 0;
        let skipped = 0;
        let errors = 0;

        for (const key of keysToRotate) {
            try {
                // Check if this key type supports auto-rotation
                if (!shouldAutoRotate(key.key_type)) {
                    console.log(`⏭️  Skipping ${key.key_name} (${key.key_type}) - manual rotation only`);
                    skipped++;
                    continue;
                }

                console.log(`🔄 Rotating key: ${key.key_name} (${key.key_type}, Tier ${key.tier})`);
                
                await KeyManagementService.rotateKey(key.id, 'system', 'Scheduled rotation');
                
                console.log(`✅ Successfully rotated key: ${key.key_name}`);
                rotated++;
            } catch (error) {
                console.error(`❌ Failed to rotate key ${key.key_name}:`, error.message);
                errors++;
            }
        }

        console.log(`✅ Key rotation check completed. Rotated: ${rotated}, Skipped: ${skipped}, Errors: ${errors}`);
    } catch (error) {
        console.error('❌ Error during key rotation:', error);
    }
});

/**
 * Cleanup expired keys (including grace period expired keys)
 * Runs weekly on Sunday at 3 AM
 */
cron.schedule('0 3 * * 0', async () => {
    console.log('🧹 Cleaning up expired keys...');

    try {
        // Deactivate keys that have expired (including grace period)
        const result = await db('api_keys')
            .where('expires_at', '<', db.raw('NOW()'))
            .where('is_active', true)
            .update({ 
                is_active: false,
                updated_at: db.raw('NOW()')
            });

        console.log(`✅ Deactivated ${result} expired keys.`);

        // Also deactivate old non-primary keys that are past grace period
        const gracePeriodResult = await db('api_keys')
            .where('is_primary', false)
            .where('is_active', true)
            .whereRaw('rotated_at IS NOT NULL')
            .whereRaw('DATE_ADD(rotated_at, INTERVAL grace_period_days DAY) < NOW()')
            .update({ 
                is_active: false,
                updated_at: db.raw('NOW()')
            });

        if (gracePeriodResult > 0) {
            console.log(`✅ Deactivated ${gracePeriodResult} keys past grace period.`);
        }
    } catch (error) {
        console.error('❌ Error cleaning up expired keys:', error);
    }
});

/**
 * Generate rotation report
 * Runs weekly on Monday at 4 AM
 */
cron.schedule('0 4 * * 1', async () => {
    console.log('📊 Generating key rotation report...');

    try {
        const report = {
            tier1: { total: 0, due: 0, rotated: 0 },
            tier2: { total: 0, due: 0, rotated: 0 },
            tier3: { total: 0, due: 0, rotated: 0 }
        };

        const keys = await db('api_keys')
            .where('is_active', true)
            .select('tier', 'key_type', 'key_name', 'rotated_at', 'rotation_interval_days');

        for (const key of keys) {
            const tier = key.tier || 'tier2';
            report[tier].total++;

            if (key.rotated_at) {
                const daysSinceRotation = Math.floor(
                    (new Date() - new Date(key.rotated_at)) / (1000 * 60 * 60 * 24)
                );
                
                if (daysSinceRotation >= key.rotation_interval_days) {
                    report[tier].due++;
                }
            } else {
                // Never rotated, check creation date
                const daysSinceCreation = Math.floor(
                    (new Date() - new Date(key.created_at)) / (1000 * 60 * 60 * 24)
                );
                
                if (daysSinceCreation >= key.rotation_interval_days) {
                    report[tier].due++;
                }
            }

            if (key.rotated_at) {
                report[tier].rotated++;
            }
        }

        console.log('📊 Key Rotation Report:');
        console.log(`   Tier 1 (High Risk): ${report.tier1.total} total, ${report.tier1.due} due, ${report.tier1.rotated} rotated`);
        console.log(`   Tier 2 (Medium Risk): ${report.tier2.total} total, ${report.tier2.due} due, ${report.tier2.rotated} rotated`);
        console.log(`   Tier 3 (Low Risk): ${report.tier3.total} total, ${report.tier3.due} due, ${report.tier3.rotated} rotated`);
    } catch (error) {
        console.error('❌ Error generating rotation report:', error);
    }
});

console.log('✅ Key rotation cron jobs initialized');

module.exports = {};

