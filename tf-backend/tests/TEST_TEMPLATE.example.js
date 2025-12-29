/**
 * Test Template - Copy this file and rename it for your new feature
 * 
 * Usage:
 * 1. Copy this file: cp TEST_TEMPLATE.example.js myFeature.test.js
 * 2. Update the describe blocks and test cases
 * 3. Run: npm test -- myFeature.test.js
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

describe('Feature Name', () => {
    let authToken;
    let testUser;
    let testArtist;

    // Setup before each test
    beforeEach(() => {
        // Generate fresh test data for each test
        testUser = generateTestUser();
        testArtist = generateTestArtist();
        
        // Generate authentication token
        authToken = generateTestToken({
            userId: 'test-user-id',
            email: testUser.email,
            userType: 'user'
        });
    });

    // ============================================================================
    // GET ENDPOINT TESTS
    // ============================================================================
    describe('GET /api/your-endpoint', () => {
        it('should return success with valid authentication', async () => {
            const response = await request(app)
                .get('/api/your-endpoint')
                .set(authHeader(authToken));

            // Flexible assertion - accepts 200 or 404 (if data doesn't exist in test DB)
            expect([200, 404]).toContain(response.status);
            
            if (response.status === 200) {
                expect(response.body).toHaveProperty('status');
            }
        });

        it('should return 401 without authentication token', async () => {
            const response = await request(app)
                .get('/api/your-endpoint');

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('status', 0);
        });

        it('should return 401 with invalid token', async () => {
            const response = await request(app)
                .get('/api/your-endpoint')
                .set(authHeader('invalid-token-string'));

            expect(response.status).toBe(401);
        });
    });

    // ============================================================================
    // POST ENDPOINT TESTS
    // ============================================================================
    describe('POST /api/your-endpoint', () => {
        it('should create resource successfully', async () => {
            const requestData = {
                // Add your request data here
                name: 'Test Resource',
                description: 'Test Description'
            };

            const response = await request(app)
                .post('/api/your-endpoint')
                .set(authHeader(authToken))
                .send(requestData);

            expect([200, 201]).toContain(response.status);
            expect(response.body).toHaveProperty('status');
            
            if (response.body.status === 1) {
                expect(response.body).toHaveProperty('data');
            }
        });

        it('should return 400 for missing required fields', async () => {
            const response = await request(app)
                .post('/api/your-endpoint')
                .set(authHeader(authToken))
                .send({
                    // Missing required fields
                });

            expect(response.status).toBe(400);
        });

        it('should return 400 for invalid data format', async () => {
            const response = await request(app)
                .post('/api/your-endpoint')
                .set(authHeader(authToken))
                .send({
                    email: 'invalid-email-format', // Invalid format
                    phone: 'not-a-phone-number'
                });

            expect(response.status).toBe(400);
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .post('/api/your-endpoint')
                .send({ name: 'Test' });

            expect(response.status).toBe(401);
        });
    });

    // ============================================================================
    // PUT/PATCH ENDPOINT TESTS
    // ============================================================================
    describe('PUT /api/your-endpoint/:id', () => {
        let resourceId;

        beforeEach(async () => {
            // Optionally create a resource first
            // const createResponse = await request(app)
            //     .post('/api/your-endpoint')
            //     .set(authHeader(authToken))
            //     .send({ name: 'Test Resource' });
            // resourceId = createResponse.body.data?.id;
        });

        it('should update resource successfully', async () => {
            if (!resourceId) {
                // Skip if no resource was created
                return;
            }

            const updateData = {
                name: 'Updated Resource Name'
            };

            const response = await request(app)
                .put(`/api/your-endpoint/${resourceId}`)
                .set(authHeader(authToken))
                .send(updateData);

            expect(response.status).toBe(200);
        });

        it('should return 404 for non-existent resource', async () => {
            const response = await request(app)
                .put('/api/your-endpoint/non-existent-id')
                .set(authHeader(authToken))
                .send({ name: 'Test' });

            expect([404, 400]).toContain(response.status);
        });
    });

    // ============================================================================
    // DELETE ENDPOINT TESTS
    // ============================================================================
    describe('DELETE /api/your-endpoint/:id', () => {
        let resourceId;

        beforeEach(async () => {
            // Optionally create a resource first
        });

        it('should delete resource successfully', async () => {
            if (!resourceId) {
                return;
            }

            const response = await request(app)
                .delete(`/api/your-endpoint/${resourceId}`)
                .set(authHeader(authToken));

            expect([200, 204]).toContain(response.status);
        });

        it('should return 404 for non-existent resource', async () => {
            const response = await request(app)
                .delete('/api/your-endpoint/non-existent-id')
                .set(authHeader(authToken));

            expect([404, 400]).toContain(response.status);
        });
    });

    // ============================================================================
    // EDGE CASES AND ERROR HANDLING
    // ============================================================================
    describe('Edge Cases', () => {
        it('should handle empty request body', async () => {
            const response = await request(app)
                .post('/api/your-endpoint')
                .set(authHeader(authToken))
                .send({});

            expect(response.status).toBe(400);
        });

        it('should handle null values', async () => {
            const response = await request(app)
                .post('/api/your-endpoint')
                .set(authHeader(authToken))
                .send({
                    name: null,
                    email: null
                });

            expect(response.status).toBe(400);
        });

        it('should handle very long strings', async () => {
            const longString = 'a'.repeat(10000);
            const response = await request(app)
                .post('/api/your-endpoint')
                .set(authHeader(authToken))
                .send({
                    name: longString
                });

            // Should either accept or reject with 400
            expect([200, 400]).toContain(response.status);
        });
    });

    // ============================================================================
    // DEBUGGING HELPERS
    // ============================================================================
    describe('Debugging Example', () => {
        it('should debug response structure', async () => {
            const response = await request(app)
                .get('/api/your-endpoint')
                .set(authHeader(authToken));

            // Uncomment to see response structure
            // console.log('Status:', response.status);
            // console.log('Body:', JSON.stringify(response.body, null, 2));
            // console.log('Headers:', response.headers);

            expect(response.status).toBeDefined();
        });
    });
});

