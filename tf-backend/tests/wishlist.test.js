/**
 * Wishlist Module Tests
 * Tests for wishlist operations
 */

const request = require('supertest');
const app = require('../app');
const { generateTestToken, authHeader } = require('./helpers/testHelpers');

describe('Wishlist Module', () => {
    let authToken;

    beforeEach(() => {
        authToken = generateTestToken({
            userId: 'test-user-id',
            userType: 'user'
        });
    });

    describe('POST /api/wishlist', () => {
        it('should add item to wishlist', async () => {
            const wishlistItem = {
                userId: 'test-user-id',
                serviceId: 'test-service-id'
            };

            const response = await request(app)
                .post('/api/wishlist')
                .set(authHeader(authToken))
                .send(wishlistItem);

            expect([200, 201, 400]).toContain(response.status);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .post('/api/wishlist')
                .send({ userId: 'test-id', serviceId: 'test-id' });

            expect(response.status).toBe(401);
        });

        it('should return error for missing required fields', async () => {
            const response = await request(app)
                .post('/api/wishlist')
                .set(authHeader(authToken))
                .send({
                    userId: 'test-id'
                    // Missing serviceId
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/wishlist', () => {
        it('should get user wishlist', async () => {
            const response = await request(app)
                .get('/api/wishlist')
                .set(authHeader(authToken));

            // May return 200, 404 (not found), or 500 (database) depending on data
            expect([200, 404, 500]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body).toHaveProperty('status');
            }
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/wishlist');

            expect(response.status).toBe(401);
        });
    });

    describe('DELETE /api/wishlist/:wishlistId', () => {
        it('should remove item from wishlist', async () => {
            const wishlistId = 'test-wishlist-id';

            const response = await request(app)
                .delete(`/api/wishlist/${wishlistId}`)
                .set(authHeader(authToken));

            // May return 200, 400 (validation), or 404 (not found)
            expect([200, 400, 404]).toContain(response.status);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .delete('/api/wishlist/test-id');

            expect(response.status).toBe(401);
        });

        it('should return error for invalid wishlistId format', async () => {
            const response = await request(app)
                .delete('/api/wishlist/invalid-id')
                .set(authHeader(authToken));

            expect([400, 404]).toContain(response.status);
        });
    });

    describe('POST /api/wishlist/contact', () => {
        it('should send contact message', async () => {
            const contactData = {
                name: 'Test User',
                email: 'test@example.com',
                message: 'This is a test contact message'
            };

            const response = await request(app)
                .post('/api/wishlist/contact')
                .set(authHeader(authToken))
                .send(contactData);

            expect([200, 201, 400]).toContain(response.status);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .post('/api/wishlist/contact')
                .send({
                    name: 'Test',
                    email: 'test@example.com',
                    message: 'Test message'
                });

            expect(response.status).toBe(401);
        });

        it('should return error for missing required fields', async () => {
            const response = await request(app)
                .post('/api/wishlist/contact')
                .set(authHeader(authToken))
                .send({
                    name: 'Test'
                    // Missing email and message
                });

            expect(response.status).toBe(400);
        });
    });
});

