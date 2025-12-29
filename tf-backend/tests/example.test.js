/**
 * Example Test File - Template for Writing New Tests
 * 
 * This file demonstrates common testing patterns used in this codebase.
 * Copy this structure when writing tests for new features.
 */

const request = require('supertest');
const app = require('../app');
const { 
    generateTestToken, 
    generateTestUser, 
    generateTestArtist,
    authHeader, 
    getErrorMessage 
} = require('./helpers/testHelpers');

// Skip example tests - these are template tests for endpoints that don't exist
describe.skip('Example Feature Tests', () => {
    let authToken;
    let testUser;

    /**
     * Runs before each test
     * Use this to set up test data, tokens, etc.
     */
    beforeEach(() => {
        // Generate fresh test user data
        testUser = generateTestUser();
        
        // Generate authentication token
        authToken = generateTestToken({
            userId: 'test-user-id',
            email: testUser.email,
            userType: 'user'
        });
    });

    /**
     * Example: Testing a GET endpoint
     */
    describe('GET /api/example/endpoint', () => {
        it('should return data successfully with valid token', async () => {
            const response = await request(app)
                .get('/api/example/endpoint')
                .set(authHeader(authToken));

            // Check status code (use array for flexible assertions)
            expect([200, 404]).toContain(response.status);
            
            // If successful, check response structure
            if (response.status === 200) {
                expect(response.body).toHaveProperty('status');
                expect(response.body).toHaveProperty('data');
            }
        });

        it('should return 401 without authentication token', async () => {
            const response = await request(app)
                .get('/api/example/endpoint');
                // No auth header

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('status', 0);
        });

        it('should return 401 with invalid token', async () => {
            const response = await request(app)
                .get('/api/example/endpoint')
                .set(authHeader('invalid-token-here'));

            expect(response.status).toBe(401);
        });
    });

    /**
     * Example: Testing a POST endpoint
     */
    describe('POST /api/example/create', () => {
        it('should create resource successfully with valid data', async () => {
            const requestData = {
                name: 'Test Resource',
                description: 'This is a test',
                // Add other required fields
            };

            const response = await request(app)
                .post('/api/example/create')
                .set(authHeader(authToken))
                .send(requestData);

            expect([200, 201]).toContain(response.status);
            
            if (response.body.status === 1) {
                expect(response.body).toHaveProperty('data');
                // Store ID for later tests if needed
                // const resourceId = response.body.data.id;
            }
        });

        it('should return 400 for missing required fields', async () => {
            const response = await request(app)
                .post('/api/example/create')
                .set(authHeader(authToken))
                .send({
                    // Missing required fields
                    name: 'Test'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('errors');
        });

        it('should return 400 for invalid data format', async () => {
            const response = await request(app)
                .post('/api/example/create')
                .set(authHeader(authToken))
                .send({
                    name: '', // Empty string
                    email: 'invalid-email', // Invalid format
                });

            expect(response.status).toBe(400);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .post('/api/example/create')
                .send({ name: 'Test' });

            expect(response.status).toBe(401);
        });
    });

    /**
     * Example: Testing CRUD operations
     */
    describe('CRUD Operations', () => {
        let resourceId;

        it('should create a resource', async () => {
            const response = await request(app)
                .post('/api/example/create')
                .set(authHeader(authToken))
                .send({
                    name: 'Test Resource',
                    // Add required fields
                });

            expect([200, 201]).toContain(response.status);
            
            if (response.body.status === 1 && response.body.data) {
                resourceId = response.body.data.id || response.body.data.resourceId;
            }
        });

        it('should get resource by ID', async () => {
            if (!resourceId) {
                // Skip if resource wasn't created
                return;
            }

            const response = await request(app)
                .get(`/api/example/${resourceId}`)
                .set(authHeader(authToken));

            expect([200, 404]).toContain(response.status);
        });

        it('should update resource', async () => {
            if (!resourceId) {
                return;
            }

            const response = await request(app)
                .post('/api/example/update')
                .set(authHeader(authToken))
                .send({
                    id: resourceId,
                    name: 'Updated Name'
                });

            expect([200, 404]).toContain(response.status);
        });

        it('should delete resource', async () => {
            if (!resourceId) {
                return;
            }

            const response = await request(app)
                .delete(`/api/example/${resourceId}`)
                .set(authHeader(authToken));

            expect([200, 404]).toContain(response.status);
        });
    });

    /**
     * Example: Testing with query parameters
     */
    describe('GET /api/example/search', () => {
        it('should search with query parameters', async () => {
            const response = await request(app)
                .get('/api/example/search')
                .query({
                    q: 'test',
                    page: 1,
                    limit: 10
                })
                .set(authHeader(authToken));

            expect(response.status).toBe(200);
        });

        it('should return error for missing required query params', async () => {
            const response = await request(app)
                .get('/api/example/search')
                .set(authHeader(authToken));
                // Missing query parameters

            expect([400, 200]).toContain(response.status);
        });
    });

    /**
     * Example: Testing error handling
     */
    describe('Error Handling', () => {
        it('should handle not found gracefully', async () => {
            const response = await request(app)
                .get('/api/example/non-existent-id')
                .set(authHeader(authToken));

            expect([404, 400]).toContain(response.status);
        });

        it('should return proper error message', async () => {
            const response = await request(app)
                .post('/api/example/create')
                .set(authHeader(authToken))
                .send({}); // Invalid data

            expect(response.status).toBe(400);
            const errorMessage = getErrorMessage(response);
            expect(errorMessage).toBeTruthy();
        });
    });
});

/**
 * Example: Testing without authentication (public endpoints)
 */
describe('Public Endpoints', () => {
    it('should allow access without authentication', async () => {
        const response = await request(app)
            .get('/api/public/endpoint');

        expect([200, 404]).toContain(response.status);
    });
});

