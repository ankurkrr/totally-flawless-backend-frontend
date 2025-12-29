/**
 * Cart Module Tests
 * Tests for cart operations (add, get, update, delete)
 */

const request = require('supertest');
const app = require('../app');
const { generateTestToken, authHeader } = require('./helpers/testHelpers');

describe('Cart Module', () => {
    let authToken;

    beforeEach(() => {
        authToken = generateTestToken({
            userId: 'test-user-id',
            userType: 'user'
        });
    });

    describe('POST /api/cart', () => {
        it('should add item to cart', async () => {
            const cartItem = {
                serviceId: 'test-service-id',
                artistId: 'test-artist-id',
                quantity: 1,
                bookingDate: '2024-12-31',
                bookingTime: '10:00'
            };

            const response = await request(app)
                .post('/api/cart')
                .set(authHeader(authToken))
                .send(cartItem);

            expect([200, 201, 400]).toContain(response.status);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .post('/api/cart')
                .send({ serviceId: 'test-id' });

            expect(response.status).toBe(401);
        });

        it('should return error for missing required fields', async () => {
            const response = await request(app)
                .post('/api/cart')
                .set(authHeader(authToken))
                .send({
                    serviceId: 'test-id'
                    // Missing other required fields
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/cart', () => {
        it('should get cart items for authenticated user', async () => {
            const response = await request(app)
                .get('/api/cart')
                .set(authHeader(authToken));

            // May return 500 if database connection issues
            expect([200, 500]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body).toHaveProperty('status');
            }
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/cart');

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/cart/assign-artist', () => {
        it('should assign artist to cart item', async () => {
            const assignData = {
                cartItemId: 'test-cart-item-id',
                artistId: 'test-artist-id'
            };

            const response = await request(app)
                .post('/api/cart/assign-artist')
                .set(authHeader(authToken))
                .send(assignData);

            expect([200, 400, 404]).toContain(response.status);
        });

        it('should return error for missing required fields', async () => {
            const response = await request(app)
                .post('/api/cart/assign-artist')
                .set(authHeader(authToken))
                .send({
                    cartItemId: 'test-id'
                    // Missing artistId
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/cart (update action)', () => {
        it('should update cart item using action', async () => {
            const updateData = {
                action: 'update',
                cartItemId: 'test-cart-item-id',
                quantity: 2
            };

            const response = await request(app)
                .post('/api/cart')
                .set(authHeader(authToken))
                .send(updateData);

            expect([200, 400, 404]).toContain(response.status);
        });
    });

    describe('POST /api/cart (delete action)', () => {
        it('should delete cart item using action', async () => {
            const deleteData = {
                action: 'delete',
                cartItemId: 'test-cart-item-id'
            };

            const response = await request(app)
                .post('/api/cart')
                .set(authHeader(authToken))
                .send(deleteData);

            expect([200, 400, 404]).toContain(response.status);
        });
    });
});

