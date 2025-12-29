/**
 * Test Database Configuration Checker
 * Run this to verify tests are using the correct database
 * Usage: node tests/test-db-config.js
 */

// Load environment variables from .env file
const path = require('path');
const dotenv = require('dotenv');
const envPath = path.resolve(__dirname, '..', '.env');
const envResult = dotenv.config({ path: envPath });

console.log('🔍 Checking Test Database Configuration...\n');

if (envResult.error) {
    console.warn('⚠️  .env file not found, tests will use environment variables or defaults');
} else {
    console.log('✅ .env file loaded successfully');
}

// Simulate what tests/setup.js does
process.env.NODE_ENV = 'test';
if (!process.env.DB_NAME) {
    process.env.DB_NAME = process.env.DB_TEST_NAME || 'flawless_test';
}

// Simulate what tests/helpers/dbHelpers.js does
const TEST_DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || process.env.DB_TEST_NAME || 'flawless_test',
    multipleStatements: true
};

console.log('\n📊 Test Database Configuration (what tests will use):');
console.log('   Host:', TEST_DB_CONFIG.host);
console.log('   Port:', TEST_DB_CONFIG.port);
console.log('   User:', TEST_DB_CONFIG.user);
console.log('   Database:', TEST_DB_CONFIG.database);
console.log('   Password:', TEST_DB_CONFIG.password ? '***SET***' : 'NOT SET');

console.log('\n📋 Environment Variables:');
console.log('   DB_HOST:', process.env.DB_HOST || 'NOT SET');
console.log('   DB_PORT:', process.env.DB_PORT || 'NOT SET');
console.log('   DB_USER:', process.env.DB_USER || 'NOT SET');
console.log('   DB_NAME:', process.env.DB_NAME || 'NOT SET');
console.log('   DB_PASSWORD:', process.env.DB_PASSWORD ? '***SET***' : 'NOT SET');
console.log('   NODE_ENV:', process.env.NODE_ENV);

// Expected values
const expectedConfig = {
    host: '35.223.84.111',
    port: 3306,
    user: 'flawless_user',
    database: 'totally-flawless',
};

console.log('\n✅ Expected Configuration:');
console.log('   Host:', expectedConfig.host);
console.log('   Port:', expectedConfig.port);
console.log('   User:', expectedConfig.user);
console.log('   Database:', expectedConfig.database);

// Check if configuration matches
const matches = 
    TEST_DB_CONFIG.host === expectedConfig.host &&
    TEST_DB_CONFIG.port === expectedConfig.port &&
    TEST_DB_CONFIG.user === expectedConfig.user &&
    TEST_DB_CONFIG.database === expectedConfig.database;

if (matches) {
    console.log('\n✅ Configuration matches expected values!');
    console.log('   Tests will use the correct database.');
} else {
    console.log('\n⚠️  Configuration does NOT match expected values!');
    console.log('   Tests may not use the correct database.');
    console.log('\n   Differences:');
    if (TEST_DB_CONFIG.host !== expectedConfig.host) {
        console.log('   - Host: Expected', expectedConfig.host, 'but got', TEST_DB_CONFIG.host);
    }
    if (TEST_DB_CONFIG.port !== expectedConfig.port) {
        console.log('   - Port: Expected', expectedConfig.port, 'but got', TEST_DB_CONFIG.port);
    }
    if (TEST_DB_CONFIG.user !== expectedConfig.user) {
        console.log('   - User: Expected', expectedConfig.user, 'but got', TEST_DB_CONFIG.user);
    }
    if (TEST_DB_CONFIG.database !== expectedConfig.database) {
        console.log('   - Database: Expected', expectedConfig.database, 'but got', TEST_DB_CONFIG.database);
    }
}

