/**
 * Test Helper Functions
 * Reusable utilities for testing
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-testing-only';

/**
 * Generate a test JWT token
 * @param {Object} payload - Token payload (user data)
 * @returns {string} JWT token
 */
function generateTestToken(payload = {}) {
    const defaultPayload = {
        userId: payload.userId || 'test-user-id',
        email: payload.email || 'test@example.com',
        userType: payload.userType || 'user',
        ...payload
    };
    
    return jwt.sign(defaultPayload, JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Generate test user data
 * @returns {Object} Test user object
 */
function generateTestUser() {
    const timestamp = Date.now();
    return {
        name: `Test User ${timestamp}`,
        email: `testuser${timestamp}@example.com`,
        phone: `+1${Math.floor(Math.random() * 10000000000)}`,
        password: 'Test123!@#'
    };
}

/**
 * Generate test artist data
 * @returns {Object} Test artist object
 */
function generateTestArtist() {
    const timestamp = Date.now();
    return {
        name: `Test Artist ${timestamp}`,
        email: `testartist${timestamp}@example.com`,
        phone: `+1${Math.floor(Math.random() * 10000000000)}`,
        password: 'Test123!@#',
        businessName: `Test Business ${timestamp}`,
        address: '123 Test Street',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345'
    };
}

/**
 * Create authorization header with token
 * @param {string} token - JWT token
 * @returns {Object} Authorization header object
 */
function authHeader(token) {
    return {
        'Authorization': `Bearer ${token}`
    };
}

/**
 * Wait for a specified time (useful for async operations)
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise}
 */
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extract error message from response
 * @param {Object} response - Supertest response object
 * @returns {string} Error message
 */
function getErrorMessage(response) {
    return response.body?.message || response.body?.error || response.text || 'Unknown error';
}

module.exports = {
    generateTestToken,
    generateTestUser,
    generateTestArtist,
    authHeader,
    wait,
    getErrorMessage
};

