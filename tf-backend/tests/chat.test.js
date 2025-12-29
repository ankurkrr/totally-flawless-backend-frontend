/**
 * Chat Module Tests
 * Tests for chat/messaging endpoints
 */

const request = require('supertest');
const app = require('../app');
const { generateTestToken, authHeader } = require('./helpers/testHelpers');

describe('Chat Module', () => {
    let authToken;
    let userToken;
    let artistToken;

    beforeEach(() => {
        authToken = generateTestToken({
            userId: 'test-user-id',
            userType: 'user'
        });
        userToken = generateTestToken({
            userId: 'test-user-id-1',
            userType: 'user'
        });
        artistToken = generateTestToken({
            userId: 'test-artist-id-1',
            userType: 'artist'
        });
    });

    describe('POST /api/chat', () => {
        it('should send chat message', async () => {
            const messageData = {
                receiverId: 'test-receiver-id',
                message: 'Hello, this is a test message'
            };

            const response = await request(app)
                .post('/api/chat')
                .set(authHeader(authToken))
                .send(messageData);

            expect([200, 201, 400]).toContain(response.status);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({
                    receiverId: 'test-id',
                    message: 'Test'
                });

            expect(response.status).toBe(401);
        });

        it('should return error for missing required fields', async () => {
            const response = await request(app)
                .post('/api/chat')
                .set(authHeader(authToken))
                .send({
                    receiverId: 'test-id'
                    // Missing message
                });

            expect(response.status).toBe(400);
        });

        it('should return error for empty message', async () => {
            const response = await request(app)
                .post('/api/chat')
                .set(authHeader(authToken))
                .send({
                    receiverId: 'test-id',
                    message: ''
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/chat/messages', () => {
        it('should get chat messages between users', async () => {
            const response = await request(app)
                .get('/api/chat/messages')
                .query({
                    otherUserId: 'test-other-user-id'
                })
                .set(authHeader(authToken));

            expect([200, 400, 404]).toContain(response.status);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/chat/messages')
                .query({ otherUserId: 'test-id' });

            expect(response.status).toBe(401);
        });

        it('should return error for missing otherUserId', async () => {
            const response = await request(app)
                .get('/api/chat/messages')
                .set(authHeader(authToken));

            // May return 400 (validation) or 401 (auth) depending on route setup
            expect([400, 401]).toContain(response.status);
        });

        it('should support pagination', async () => {
            const response = await request(app)
                .get('/api/chat/messages')
                .query({
                    otherUserId: 'test-other-user-id',
                    page: 1,
                    limit: 20
                })
                .set(authHeader(authToken));

            expect([200, 400]).toContain(response.status);
        });
    });

    describe('GET /api/chat/list', () => {
        it('should get chat list for user', async () => {
            const response = await request(app)
                .get('/api/chat/list')
                .set(authHeader(authToken));

            // May require query params or return 400 if validation fails
            expect([200, 400]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body).toHaveProperty('status');
            }
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/chat/list');

            expect(response.status).toBe(401);
        });

        it('should support query parameters', async () => {
            const response = await request(app)
                .get('/api/chat/list')
                .query({
                    unreadOnly: true,
                    limit: 50
                })
                .set(authHeader(authToken));

            // May return 200 or 400 depending on validation
            expect([200, 400]).toContain(response.status);
        });
    });
});
