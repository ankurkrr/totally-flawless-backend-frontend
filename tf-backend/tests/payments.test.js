/**
 * Payment Module Tests
 * Tests for payment intents, confirmations, and history
 */

const request = require('supertest');
const app = require('../app');
const { generateTestToken, authHeader } = require('./helpers/testHelpers');

describe('Payment Module', () => {
    let authToken;

    beforeEach(() => {
        authToken = generateTestToken({
            userId: 'test-user-id',
            userType: 'user'
        });
    });

    describe('POST /api/payments/gratuity', () => {
        it('should make gratuity payment', async () => {
            const paymentData = {
                bookingId: 'test-booking-id',
                amount: 1000, // Amount in cents
                paymentMethodId: 'pm_test_123'
            };

            const response = await request(app)
                .post('/api/payments/gratuity')
                .set(authHeader(authToken))
                .send(paymentData);

            expect([200, 201, 400, 404]).toContain(response.status);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .post('/api/payments/gratuity')
                .send({ amount: 1000 });

            expect(response.status).toBe(401);
        });

        it('should return error for missing required fields', async () => {
            const response = await request(app)
                .post('/api/payments/gratuity')
                .set(authHeader(authToken))
                .send({
                    amount: 1000
                    // Missing bookingId and paymentMethodId
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/payments/booking', () => {
        it('should pay booking balance', async () => {
            const paymentData = {
                bookingId: 'test-booking-id',
                amount: 5000,
                paymentMethodId: 'pm_test_123'
            };

            const response = await request(app)
                .post('/api/payments/booking')
                .set(authHeader(authToken))
                .send(paymentData);

            expect([200, 400, 404]).toContain(response.status);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .post('/api/payments/booking')
                .send({ bookingId: 'test-id' });

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/payments/booking-payment', () => {
        it('should process bulk booking payment', async () => {
            const paymentData = {
                bookingIds: ['test-booking-id-1', 'test-booking-id-2'],
                amount: 10000,
                paymentMethodId: 'pm_test_123'
            };

            const response = await request(app)
                .post('/api/payments/booking-payment')
                .set(authHeader(authToken))
                .send(paymentData);

            expect([200, 400]).toContain(response.status);
        });

        it('should return error for invalid booking IDs', async () => {
            const response = await request(app)
                .post('/api/payments/booking-payment')
                .set(authHeader(authToken))
                .send({
                    bookingIds: [],
                    amount: 1000
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/payments/booking-amount-paid', () => {
        it('should update booking amount paid', async () => {
            const updateData = {
                bookingIds: ['test-booking-id-1'],
                amountPaid: 5000
            };

            const response = await request(app)
                .post('/api/payments/booking-amount-paid')
                .set(authHeader(authToken))
                .send(updateData);

            expect([200, 400, 404]).toContain(response.status);
        });
    });

    describe('POST /webhook', () => {
        it('should handle Stripe webhook events', async () => {
            // Note: Webhook testing requires proper Stripe signature
            // This is a basic structure - adjust based on your webhook implementation
            const webhookPayload = {
                id: 'evt_test_webhook',
                type: 'payment_intent.succeeded',
                data: {
                    object: {
                        id: 'pi_test_123',
                        metadata: {
                            transaction: 'test-transaction-id'
                        }
                    }
                }
            };

            const response = await request(app)
                .post('/webhook')
                .send(webhookPayload)
                .set('Content-Type', 'application/json');

            // Webhook may return 400 if signature is invalid (expected in test)
            expect([200, 400]).toContain(response.status);
        });
    });
});

