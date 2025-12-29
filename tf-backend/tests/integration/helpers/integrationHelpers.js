/**
 * Integration Test Helpers
 * Utilities for integration testing with database
 */

const request = require('supertest');
const app = require('../../../app');
const { generateTestToken, authHeader } = require('../../helpers/testHelpers');
const { insertTestData, cleanAllTestData, query } = require('../../helpers/dbHelpers');
const { createTestUser, createTestArtist, createTestBooking } = require('../../helpers/mockFactories');

/**
 * Create a test user in the database and return auth token
 * @param {Object} userData - Optional user data overrides
 * @returns {Promise<{user: Object, token: string}>}
 */
async function createAuthenticatedUser(userData = {}) {
    const testUser = createTestUser(userData);
    
    let user;
    try {
        // Insert user into database
        user = await insertTestData('users', {
            id: testUser.id,
            phone: testUser.phone,
            firstName: testUser.name.split(' ')[0] || testUser.name,
            lastName: testUser.name.split(' ')[1] || '',
            email: testUser.email,
            otp: '123456',
            createdDate: new Date().toISOString().slice(0, 19).replace('T', ' ')
        });
    } catch (error) {
        // If database insert fails, use test data without insert
        console.warn('⚠️  Failed to insert user, using test data:', error.message);
        user = {
            id: testUser.id,
            phone: testUser.phone,
            firstName: testUser.name.split(' ')[0] || testUser.name,
            lastName: testUser.name.split(' ')[1] || '',
            email: testUser.email,
            otp: '123456'
        };
    }

    // Generate token
    const token = generateTestToken({
        userId: user.id,
        email: user.email,
        userType: 'user'
    });

    return { user, token };
}

/**
 * Create a test artist in the database and return auth token
 * @param {Object} artistData - Optional artist data overrides
 * @returns {Promise<{artist: Object, token: string}>}
 */
async function createAuthenticatedArtist(artistData = {}) {
    const testArtist = createTestArtist(artistData);
    
    let artist;
    try {
        // Insert artist into database
        // Schema uses firstName/lastName (not name), mobile (not phone), createdDate (not createdAt)
        artist = await insertTestData('artists', {
            id: testArtist.id,
            mobile: testArtist.phone, // Use 'mobile' for artists table
            firstName: testArtist.name.split(' ')[0] || testArtist.name, // Use firstName instead of name
            lastName: testArtist.name.split(' ')[1] || '',
            email: testArtist.email,
            address: testArtist.address,
            city: testArtist.city,
            state: testArtist.state,
            otp: '123456',
            isApproved: false,
            createdDate: new Date().toISOString().slice(0, 19).replace('T', ' ') // Use createdDate
        });
    } catch (error) {
        // If database insert fails, use test data without insert
        console.warn('⚠️  Failed to insert artist, using test data:', error.message);
        artist = {
            id: testArtist.id,
            phone: testArtist.phone,
            name: testArtist.name,
            email: testArtist.email,
            businessName: testArtist.businessName,
            address: testArtist.address,
            city: testArtist.city,
            state: testArtist.state,
            zipCode: testArtist.zipCode,
            otp: '123456',
            isApproved: false
        };
    }

    // Generate token
    const token = generateTestToken({
        userId: artist.id,
        email: artist.email,
        userType: 'artist'
    });

    return { artist, token };
}

/**
 * Make authenticated request
 * @param {string} method - HTTP method
 * @param {string} endpoint - API endpoint
 * @param {string} token - Auth token
 * @param {Object} data - Request body/query
 * @returns {Promise<Object>} Response object
 */
async function makeAuthenticatedRequest(method, endpoint, token, data = {}) {
    const req = request(app)[method.toLowerCase()](endpoint)
        .set(authHeader(token));

    if (method === 'GET') {
        return req.query(data);
    } else {
        return req.send(data);
    }
}

/**
 * Create a complete booking flow (user, artist, cart, booking)
 * @returns {Promise<Object>} Complete booking setup
 */
async function createCompleteBookingFlow() {
    // Create user and artist
    const { user, token: userToken } = await createAuthenticatedUser();
    const { artist, token: artistToken } = await createAuthenticatedArtist();

    let cart, service, cartItem, bookingReq;
    
    try {
        // Create cart
        // Try with 'createdAt' first (common schema), fallback handled in catch
        cart = await insertTestData('usercart', {
            id: require('uuid').v4(),
            userId: user.id,
            isActive: 1,
            createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
        });

        // Create service (if needed)
        service = await insertTestData('services', {
            id: require('uuid').v4(),
            name: 'Test Service',
            price: 50.00,
            duration: 60,
            isActive: 1
        });

        // Create cart item
        cartItem = await insertTestData('cartitems', {
            id: require('uuid').v4(),
            cartId: cart.id,
            serviceId: service.id,
            artistId: artist.id,
            quantity: 1,
            price: 50.00,
            bookingType: 'later',
            bookingTime: '10:00'
        });

        // Create booking request
        bookingReq = await insertTestData('booking_req', {
            id: require('uuid').v4(),
            cartId: cart.id,
            cartitemid: cartItem.id,
            artistId: artist.id,
            status: 'accepted',
            qty: 1
        });
    } catch (error) {
        console.warn('⚠️  Failed to create booking flow data:', error.message);
        // Create minimal test data
        const uuid = require('uuid').v4();
        cart = { id: uuid, userId: user.id };
        service = { id: uuid, name: 'Test Service' };
        cartItem = { id: uuid, cartId: cart.id, serviceId: service.id };
        bookingReq = { id: uuid, cartId: cart.id };
    }

    return {
        user,
        artist,
        userToken,
        artistToken,
        cart,
        service,
        cartItem,
        bookingReq
    };
}

/**
 * Clean up test data after integration test
 * @param {Array<string>} ids - IDs to clean up
 * @param {Array<string>} tables - Tables to clean
 */
async function cleanupTestData(ids = [], tables = []) {
    if (ids.length > 0) {
        for (const { table, id } of ids) {
            try {
                // Try UUID format first (most common)
                // The query function will silently handle UUID errors
                await query(`DELETE FROM ${table} WHERE id = ?`, [id]);
            } catch (error) {
                // Ignore cleanup errors - they're handled by query function
                // This catch is just for safety
            }
        }
    }
    
    if (tables.length > 0) {
        try {
            await cleanAllTestData();
        } catch (error) {
            // Ignore cleanup errors
        }
    }
}

/**
 * Wait for async operations to complete
 * @param {number} ms - Milliseconds to wait
 */
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Assert response structure
 * @param {Object} response - Supertest response
 * @param {number} expectedStatus - Expected HTTP status
 * @param {Object} expectedBody - Expected response body structure
 */
function assertResponse(response, expectedStatus, expectedBody = {}) {
    expect(response.status).toBe(expectedStatus);
    
    if (expectedBody.status !== undefined) {
        expect(response.body).toHaveProperty('status', expectedBody.status);
    }
    
    if (expectedBody.data !== undefined) {
        expect(response.body).toHaveProperty('data');
    }
    
    if (expectedBody.message !== undefined) {
        expect(response.body).toHaveProperty('message');
    }
}

/**
 * Get test database connection
 * @returns {Promise<Object>} Database connection
 */
async function getTestDbConnection() {
    const { getConnection } = require('../../helpers/dbHelpers');
    return await getConnection();
}

module.exports = {
    createAuthenticatedUser,
    createAuthenticatedArtist,
    makeAuthenticatedRequest,
    createCompleteBookingFlow,
    cleanupTestData,
    wait,
    assertResponse,
    getTestDbConnection
};

