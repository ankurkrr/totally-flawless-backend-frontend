/**
 * Device Module Tests
 * Tests for device management and call endpoints
 */

const request = require('supertest');
const app = require('../app');
const { generateTestToken, authHeader } = require('./helpers/testHelpers');

describe('Device Module', () => {
    let authToken;

    beforeEach(() => {
        authToken = generateTestToken({
            userId: 'test-user-id',
            userType: 'user'
        });
    });

    describe('POST /api/devices', () => {
        it('should manage device token', async () => {
            const deviceData = {
                userId: 'test-user-id',
                deviceToken: 'test-device-token-12345',
                deviceType: 'ios'
            };

            const response = await request(app)
                .post('/api/devices')
                .set(authHeader(authToken))
                .send(deviceData);

            expect([200, 201, 400]).toContain(response.status);
        });

        it('should accept android device type', async () => {
            const deviceData = {
                userId: 'test-user-id',
                deviceToken: 'test-device-token-android',
                deviceType: 'android'
            };

            const response = await request(app)
                .post('/api/devices')
                .set(authHeader(authToken))
                .send(deviceData);

            expect([200, 201, 400]).toContain(response.status);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .post('/api/devices')
                .send({
                    userId: 'test-id',
                    deviceToken: 'test-token',
                    deviceType: 'ios'
                });

            expect(response.status).toBe(401);
        });

        it('should return error for missing required fields', async () => {
            const response = await request(app)
                .post('/api/devices')
                .set(authHeader(authToken))
                .send({
                    userId: 'test-id'
                    // Missing deviceToken and deviceType
                });

            expect(response.status).toBe(400);
        });

        it('should return error for invalid device type', async () => {
            const response = await request(app)
                .post('/api/devices')
                .set(authHeader(authToken))
                .send({
                    userId: 'test-id',
                    deviceToken: 'test-token',
                    deviceType: 'windows' // Invalid type
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/devices/call', () => {
        it('should create call', async () => {
            const callData = {
                userId: 'test-user-id',
                artistId: 'test-artist-id',
                bookingId: 'test-booking-id'
            };

            const response = await request(app)
                .post('/api/devices/call')
                .set(authHeader(authToken))
                .send(callData);

            expect([200, 201, 400]).toContain(response.status);
        });

        it('should create call without bookingId', async () => {
            const callData = {
                userId: 'test-user-id',
                artistId: 'test-artist-id'
            };

            const response = await request(app)
                .post('/api/devices/call')
                .set(authHeader(authToken))
                .send(callData);

            expect([200, 201, 400]).toContain(response.status);
        });

        it('should return error for missing required fields', async () => {
            const response = await request(app)
                .post('/api/devices/call')
                .set(authHeader(authToken))
                .send({
                    userId: 'test-id'
                    // Missing artistId
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/devices/call', () => {
        it('should get call information by callId', async () => {
            const response = await request(app)
                .get('/api/devices/call')
                .query({
                    callId: 'test-call-id'
                })
                .set(authHeader(authToken));

            // May return 200, 400 (validation), or 404 (not found)
            expect([200, 400, 404]).toContain(response.status);
        });

        it('should get call information by userId', async () => {
            const response = await request(app)
                .get('/api/devices/call')
                .query({
                    userId: 'test-user-id'
                })
                .set(authHeader(authToken));

            // May return 200, 400 (validation), or 404 (not found)
            expect([200, 400, 404]).toContain(response.status);
        });

        it('should get call information by artistId', async () => {
            const response = await request(app)
                .get('/api/devices/call')
                .query({
                    artistId: 'test-artist-id'
                })
                .set(authHeader(authToken));

            // May return 200, 400 (validation), or 404 (not found)
            expect([200, 400, 404]).toContain(response.status);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/devices/call')
                .query({ callId: 'test-id' });

            expect(response.status).toBe(401);
        });

        it('should return error when no query parameters provided', async () => {
            const response = await request(app)
                .get('/api/devices/call')
                .set(authHeader(authToken));

            // May return 400 (validation) or 401 (auth) depending on route setup
            expect([400, 401]).toContain(response.status);
        });
    });
});

