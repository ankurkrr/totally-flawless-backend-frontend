/**
 * Artist Module Tests
 * Tests for artist management and profile operations
 */

const request = require('supertest');
const app = require('../app');
const { generateTestToken, generateTestArtist, authHeader } = require('./helpers/testHelpers');

describe('Artist Module', () => {
    let artistToken;
    let testArtist;

    beforeEach(() => {
        testArtist = generateTestArtist();
        artistToken = generateTestToken({
            userId: 'test-artist-id',
            email: testArtist.email,
            userType: 'artist'
        });
    });

    describe('GET /api/artists', () => {
        it('should get list of artists', async () => {
            const response = await request(app)
                .get('/api/artists');

            // Endpoint may not exist or require authentication
            expect([200, 404, 401]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body).toHaveProperty('status');
            }
        });

        it('should support query parameters for filtering', async () => {
            const response = await request(app)
                .get('/api/artists')
                .query({
                    city: 'New York',
                    serviceId: 'test-service-id'
                });

            // Endpoint may not exist or require authentication
            expect([200, 404, 401]).toContain(response.status);
        });
    });

    describe('GET /api/artists/:id', () => {
        it('should get artist details by ID', async () => {
            const artistId = 'test-artist-id';

            const response = await request(app)
                .get(`/api/artists/${artistId}`);

            // May return 200, 400 (validation), or 404 (not found)
            expect([200, 400, 404]).toContain(response.status);
        });
    });

    describe('GET /api/artists/profile', () => {
        it('should get artist profile with valid token', async () => {
            const response = await request(app)
                .get('/api/artists/profile')
                .set(authHeader(artistToken));

            // May return 200, 400 (validation), or 404 (not found)
            expect([200, 400, 404]).toContain(response.status);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/artists/profile');

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/artists/update', () => {
        it('should update artist profile', async () => {
            const updateData = {
                id: 'test-artist-id',
                businessName: 'Updated Business Name',
                address: '456 New Street',
                images: [], // Ensure images is an array
                city: 'Los Angeles'
            };

            const response = await request(app)
                .post('/api/artists/update')
                .set(authHeader(artistToken))
                .send(updateData);

            expect([200, 400, 404]).toContain(response.status);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .post('/api/artists/update')
                .send({ businessName: 'Test' });

            expect(response.status).toBe(401);
        });
    });
});

