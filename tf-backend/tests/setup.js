/**
 * Test Setup File
 * Runs before all tests - configures test environment
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-testing-only';
process.env.PORT = process.env.PORT || '3001'; // Use different port for tests

// Load environment variables from .env file if it exists
const path = require('path');
const dotenv = require('dotenv');
const envPath = path.resolve(__dirname, '..', '.env');
const envResult = dotenv.config({ path: envPath });
if (!envResult.error) {
    console.log('✅ Loaded .env file for tests');
}

// Use existing database for tests (don't override if already set)
// If you want to use a separate test database, set DB_NAME=flawless_test in .env.test
if (!process.env.DB_NAME) {
    // Fallback to test database name if DB_NAME not set
    process.env.DB_NAME = process.env.DB_TEST_NAME || 'flawless_test';
}

// Log database configuration being used (without password)
console.log('📊 Test Database Configuration:');
console.log('   Host:', process.env.DB_HOST || 'NOT SET');
console.log('   Port:', process.env.DB_PORT || '3306');
console.log('   User:', process.env.DB_USER || 'NOT SET');
console.log('   Database:', process.env.DB_NAME || 'NOT SET');

// Set AWS credentials for tests (required by s3ServiceImg)
process.env.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || 'test-key';
process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || 'test-secret';
process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-2';
process.env.S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'test-bucket';

// Prevent database connection from exiting process during tests
// Mock process.exit to prevent test suite from crashing
const originalExit = process.exit;
process.exit = jest.fn((code) => {
    // In test environment, don't actually exit
    if (process.env.NODE_ENV === 'test') {
        console.warn(`⚠️  process.exit(${code}) called in test environment - ignoring`);
        return;
    }
    return originalExit(code);
});

// Disable rate limiting in test environment
jest.mock('../middleware/rateLimiter', () => {
    const noOp = (req, res, next) => next();
    return {
        apiLimiter: noOp,
        authLimiter: noOp,
        uploadLimiter: noOp,
        paymentLimiter: noOp
    };
});

// Mock external services to prevent real API calls
jest.mock('../services/stripe', () => ({
    paymentIntents: {
        create: jest.fn().mockResolvedValue({
            id: 'pi_test_123',
            client_secret: 'pi_test_123_secret',
            status: 'requires_payment_method'
        }),
        retrieve: jest.fn().mockResolvedValue({
            id: 'pi_test_123',
            status: 'succeeded'
        }),
        confirm: jest.fn().mockResolvedValue({
            id: 'pi_test_123',
            status: 'succeeded'
        })
    },
    webhooks: {
        constructEvent: jest.fn().mockReturnValue({
            type: 'payment_intent.succeeded',
            data: {
                object: {
                    id: 'pi_test_123',
                    metadata: {}
                }
            }
        })
    }
}));

jest.mock('../connection/twilioOtp', () => ({
    sendOTP: jest.fn().mockResolvedValue(true),
    verifyOTP: jest.fn().mockResolvedValue(true),
    sendOtp: jest.fn().mockResolvedValue(true),
    verifyOtp: jest.fn().mockResolvedValue(true),
    default: jest.fn().mockResolvedValue(true)
}));

// Mock KeyProvider to return test JWT secret
// This ensures auth middleware can verify test tokens
// Note: Must use process.env directly in mock factory (Jest restriction)
jest.mock('../utils/keyProvider', () => {
    const mockJWTSecret = process.env.JWT_SECRET || 'test-secret-key-for-testing-only';
    return {
        getJWTSecret: jest.fn().mockResolvedValue(mockJWTSecret),
        getAllJWTSecrets: jest.fn().mockResolvedValue([mockJWTSecret]),
        getKey: jest.fn().mockResolvedValue(mockJWTSecret)
    };
});

// Mock S3Service as a class constructor
jest.mock('../connection/s3Service', () => {
    return jest.fn().mockImplementation(() => ({
        uploadFile: jest.fn().mockResolvedValue({
            Location: 'https://s3.amazonaws.com/bucket/test-file.jpg',
            Key: 'test-file.jpg'
        }),
        deleteFile: jest.fn().mockResolvedValue(true),
        getSignedUrl: jest.fn().mockResolvedValue('https://s3.amazonaws.com/bucket/test-file.jpg?signature=test')
    }));
});

jest.mock('../connection/sendmail', () => ({
    sendEmail: jest.fn().mockResolvedValue(true)
}));

// Mock activityLogger to prevent async logging after tests complete
jest.mock('../services/admin/activityLogger', () => {
    return (req, res, next) => {
        // In test environment, just pass through without logging
        next();
    };
});

// Increase timeout for integration tests
jest.setTimeout(10000);

// Mock console methods to reduce noise in test output (optional)
// Uncomment to silence console output during tests
/*
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};
*/

// Global test utilities
global.testHelpers = require('./helpers/testHelpers');
global.dbHelpers = require('./helpers/dbHelpers');
global.mockFactories = require('./helpers/mockFactories');

// Global teardown - close database connections after all tests
// Note: The actual cleanup is handled by globalTeardown in jest.config.js
// This is kept as a backup but should not block
afterAll(async () => {
    // Return immediately - cleanup handled by globalTeardown
    // This prevents timeout issues
    return Promise.resolve();
}, 1000); // Very short timeout

