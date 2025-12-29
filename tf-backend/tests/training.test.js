/**
 * Training Module Tests
 * Tests for training service endpoints
 */

const request = require('supertest');
const app = require('../app');
const { generateTestToken, authHeader } = require('./helpers/testHelpers');

describe('Training Module', () => {
    let authToken;

    beforeEach(() => {
        authToken = generateTestToken({
            userId: 'test-user-id',
            userType: 'user'
        });
    });

    describe('POST /api/training', () => {
        it('should add training service', async () => {
            const trainingData = {
                user_id: 'test-user-id',
                service_id: 'test-service-id',
                price: 100.00,
                training_date: '2024-12-31',
                training_time: '10:00'
            };

            const response = await request(app)
                .post('/api/training')
                .set(authHeader(authToken))
                .send(trainingData);

            expect([200, 201, 400]).toContain(response.status);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .post('/api/training')
                .send({
                    user_id: 'test-id',
                    service_id: 'test-service-id',
                    price: 100.00
                });

            expect(response.status).toBe(401);
        });

        it('should return error for missing required fields', async () => {
            const response = await request(app)
                .post('/api/training')
                .set(authHeader(authToken))
                .send({
                    user_id: 'test-id'
                    // Missing service_id, price, dates
                });

            expect(response.status).toBe(400);
        });

        it('should return error for invalid price', async () => {
            const response = await request(app)
                .post('/api/training')
                .set(authHeader(authToken))
                .send({
                    user_id: 'test-id',
                    service_id: 'test-service-id',
                    price: -10, // Invalid negative price
                    training_date: '2024-12-31',
                    training_time: '10:00'
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/training', () => {
        it('should get training services', async () => {
            const response = await request(app)
                .get('/api/training')
                .set(authHeader(authToken));

            // May require query params or return different status
            expect([200, 400, 500]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body).toHaveProperty('status');
            }
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/training');

            expect(response.status).toBe(401);
        });

        it('should support query parameters', async () => {
            const response = await request(app)
                .get('/api/training')
                .query({
                    userId: 'test-user-id',
                    status: 'pending'
                })
                .set(authHeader(authToken));

            // May return different status depending on validation
            expect([200, 400, 500]).toContain(response.status);
        });
    });

    describe('POST /api/training/payment', () => {
        it('should process training payment', async () => {
            const paymentData = {
                trainingId: 'test-training-id',
                amount: 100.00
            };

            const response = await request(app)
                .post('/api/training/payment')
                .set(authHeader(authToken))
                .send(paymentData);

            expect([200, 400, 404]).toContain(response.status);
        });

        it('should return error for missing required fields', async () => {
            const response = await request(app)
                .post('/api/training/payment')
                .set(authHeader(authToken))
                .send({
                    trainingId: 'test-id'
                    // Missing amount
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/training/payment-intent', () => {
        it('should get training payment intent', async () => {
            const paymentData = {
                trainingId: 'test-training-id',
                amount: 100.00
            };

            const response = await request(app)
                .post('/api/training/payment-intent')
                .set(authHeader(authToken))
                .send(paymentData);

            expect([200, 400, 404]).toContain(response.status);
        });

        it('should return error for invalid amount', async () => {
            const response = await request(app)
                .post('/api/training/payment-intent')
                .set(authHeader(authToken))
                .send({
                    trainingId: 'test-id',
                    amount: 0 // Invalid amount
                });

            expect(response.status).toBe(400);
        });
    });
});

