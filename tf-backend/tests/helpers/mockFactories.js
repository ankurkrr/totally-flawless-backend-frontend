/**
 * Mock Data Factories
 * Generate test data for various entities
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Generate test user data
 * @param {Object} overrides - Override default values
 * @returns {Object} User object
 */
function createTestUser(overrides = {}) {
    const timestamp = Date.now();
    return {
        id: uuidv4(),
        name: `Test User ${timestamp}`,
        email: `testuser${timestamp}@example.com`,
        phone: `+1${Math.floor(Math.random() * 10000000000)}`,
        password: 'Test123!@#',
        userType: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides
    };
}

/**
 * Generate test artist data
 * @param {Object} overrides - Override default values
 * @returns {Object} Artist object
 */
function createTestArtist(overrides = {}) {
    const timestamp = Date.now();
    return {
        id: uuidv4(),
        name: `Test Artist ${timestamp}`,
        email: `testartist${timestamp}@example.com`,
        phone: `+1${Math.floor(Math.random() * 10000000000)}`,
        password: 'Test123!@#',
        businessName: `Test Business ${timestamp}`,
        address: '123 Test Street',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        userType: 'artist',
        isApproved: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides
    };
}

/**
 * Generate test address data
 * @param {Object} overrides - Override default values
 * @returns {Object} Address object
 */
function createTestAddress(overrides = {}) {
    return {
        id: uuidv4(),
        userId: uuidv4(),
        addressLine1: '123 Main St',
        addressLine2: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides
    };
}

/**
 * Generate test cart data
 * @param {Object} overrides - Override default values
 * @returns {Object} Cart object
 */
function createTestCart(overrides = {}) {
    return {
        id: uuidv4(),
        userId: uuidv4(),
        totalAmount: 100.00,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides
    };
}

/**
 * Generate test cart item data
 * @param {Object} overrides - Override default values
 * @returns {Object} Cart item object
 */
function createTestCartItem(overrides = {}) {
    return {
        id: uuidv4(),
        cartId: uuidv4(),
        serviceId: uuidv4(),
        artistId: uuidv4(),
        quantity: 1,
        price: 50.00,
        bookingDate: new Date(),
        bookingTime: '10:00',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides
    };
}

/**
 * Generate test booking data
 * @param {Object} overrides - Override default values
 * @returns {Object} Booking object
 */
function createTestBooking(overrides = {}) {
    return {
        id: uuidv4(),
        userId: uuidv4(),
        artistId: uuidv4(),
        cartId: uuidv4(),
        addressId: uuidv4(),
        bookingDate: new Date(),
        bookingTime: '10:00',
        bookingType: 'later',
        status: 'pending',
        totalAmount: 100.00,
        amountPaid: 0.00,
        gratuity: 0.00,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides
    };
}

/**
 * Generate test service data
 * @param {Object} overrides - Override default values
 * @returns {Object} Service object
 */
function createTestService(overrides = {}) {
    return {
        id: uuidv4(),
        name: 'Test Service',
        description: 'Test service description',
        categoryId: uuidv4(),
        price: 50.00,
        duration: 60,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides
    };
}

/**
 * Generate test payment data
 * @param {Object} overrides - Override default values
 * @returns {Object} Payment object
 */
function createTestPayment(overrides = {}) {
    return {
        id: uuidv4(),
        userId: uuidv4(),
        bookingId: uuidv4(),
        amount: 100.00,
        currency: 'USD',
        status: 'pending',
        paymentMethodId: 'pm_test_123',
        paymentIntentId: 'pi_test_123',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides
    };
}

/**
 * Generate test chat message data
 * @param {Object} overrides - Override default values
 * @returns {Object} Chat message object
 */
function createTestChatMessage(overrides = {}) {
    return {
        id: uuidv4(),
        senderId: uuidv4(),
        receiverId: uuidv4(),
        message: 'Test message',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides
    };
}

/**
 * Generate test wishlist data
 * @param {Object} overrides - Override default values
 * @returns {Object} Wishlist object
 */
function createTestWishlist(overrides = {}) {
    return {
        id: uuidv4(),
        userId: uuidv4(),
        serviceId: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides
    };
}

module.exports = {
    createTestUser,
    createTestArtist,
    createTestAddress,
    createTestCart,
    createTestCartItem,
    createTestBooking,
    createTestService,
    createTestPayment,
    createTestChatMessage,
    createTestWishlist
};

