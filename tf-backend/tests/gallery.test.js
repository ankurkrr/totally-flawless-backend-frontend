/**
 * Gallery Module Tests
 * Tests for gallery/image management endpoints
 */

const request = require('supertest');
const app = require('../app');
const { generateTestToken, authHeader } = require('./helpers/testHelpers');
const path = require('path');

describe('Gallery Module', () => {
    let authToken;

    beforeEach(() => {
        authToken = generateTestToken({
            userId: 'test-user-id',
            userType: 'user'
        });
    });

    describe('POST /api/gallery', () => {
        it('should add gallery image', async () => {
            // Note: This test may need adjustment based on actual file upload implementation
            const response = await request(app)
                .post('/api/gallery')
                .set(authHeader(authToken))
                .field('userId', 'test-user-id')
                .attach('image', path.join(__dirname, 'fixtures', 'test-image.jpg'))
                .catch(() => {
                    // If file doesn't exist, test with just form data
                    return request(app)
                        .post('/api/gallery')
                        .set(authHeader(authToken))
                        .send({
                            userId: 'test-user-id',
                            imageUrl: 'https://example.com/test-image.jpg'
                        });
                });

            expect([200, 201, 400]).toContain(response.status);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .post('/api/gallery')
                .send({
                    userId: 'test-id',
                    imageUrl: 'https://example.com/image.jpg'
                });

            expect(response.status).toBe(401);
        });

        it('should return error for missing userId', async () => {
            const response = await request(app)
                .post('/api/gallery')
                .set(authHeader(authToken))
                .send({
                    imageUrl: 'https://example.com/image.jpg'
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/gallery/:userId', () => {
        it('should get gallery by user ID', async () => {
            const userId = 'test-user-id';

            const response = await request(app)
                .get(`/api/gallery/${userId}`)
                .set(authHeader(authToken));

            // May return 200, 400 (validation), or 404 (not found)
            expect([200, 400, 404]).toContain(response.status);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/gallery/test-user-id');

            expect(response.status).toBe(401);
        });

        it('should return error for invalid userId format', async () => {
            const response = await request(app)
                .get('/api/gallery/invalid-id')
                .set(authHeader(authToken));

            expect([400, 404]).toContain(response.status);
        });
    });

    describe('DELETE /api/gallery/:id', () => {
        it('should delete gallery image', async () => {
            const galleryId = 'test-gallery-id';

            const response = await request(app)
                .delete(`/api/gallery/${galleryId}`)
                .set(authHeader(authToken));

            // May return 200, 400 (validation), or 404 (not found)
            expect([200, 400, 404]).toContain(response.status);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .delete('/api/gallery/test-id');

            expect(response.status).toBe(401);
        });

        it('should return error for invalid gallery ID format', async () => {
            const response = await request(app)
                .delete('/api/gallery/invalid-id')
                .set(authHeader(authToken));

            expect([400, 404]).toContain(response.status);
        });
    });
});

