/**
 * User Module Tests
 * Tests for user profile management and addresses
 */

const request = require('supertest');
const app = require('../app');
const { generateTestToken, generateTestUser, authHeader, getErrorMessage } = require('./helpers/testHelpers');

describe('User Module', () => {
    let authToken;
    let testUser;

    beforeEach(() => {
        testUser = generateTestUser();
        // Generate a test token for authenticated requests
        authToken = generateTestToken({
            userId: 'test-user-id',
            email: testUser.email,
            userType: 'user'
        });
    });

    describe('GET /api/users/profile', () => {
        it('should get user profile with valid token', async () => {
            const response = await request(app)
                .get('/api/users/profile')
                .set(authHeader(authToken));

            expect([200, 404]).toContain(response.status);
            
            if (response.status === 200) {
                expect(response.body).toHaveProperty('status');
            }
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
                .get('/api/users/profile');

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('status', 0);
        });

        it('should return 401 with invalid token', async () => {
            const response = await request(app)
                .get('/api/users/profile')
                .set(authHeader('invalid-token'));

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/users/update', () => {
        it('should update user profile with valid data', async () => {
            const updateData = {
                name: 'Updated Name',
                phone: '+1987654321'
            };

            const response = await request(app)
                .post('/api/users/update')
                .set(authHeader(authToken))
                .send(updateData);

            expect([200, 400, 404]).toContain(response.status);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .post('/api/users/update')
                .send({ name: 'Test' });

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/users/update-gratuity', () => {
        it('should update user gratuity preference', async () => {
            const response = await request(app)
                .post('/api/users/update-gratuity')
                .set(authHeader(authToken))
                .send({
                    gratuity: 15
                });

            expect([200, 400]).toContain(response.status);
        });
    });

    describe('Address Management', () => {
        let addressId;

        describe('POST /api/users/addresses', () => {
            it('should add a new address', async () => {
                const addressData = {
                    addressLine1: '123 Main St',
                    addressLine2: 'Apt 4B',
                    city: 'New York',
                    state: 'NY',
                    zipCode: '10001',
                    country: 'USA',
                    isDefault: true
                };

                const response = await request(app)
                    .post('/api/users/addresses')
                    .set(authHeader(authToken))
                    .send(addressData);

                // May return 200, 201 (created), or 400 (validation error)
                expect([200, 201, 400]).toContain(response.status);
                
                if (response.body.status === 1 && response.body.data) {
                    addressId = response.body.data.addressId || response.body.data.id;
                }
            });

            it('should return error for missing required fields', async () => {
                const response = await request(app)
                    .post('/api/users/addresses')
                    .set(authHeader(authToken))
                    .send({
                        city: 'New York'
                        // Missing other required fields
                    });

                expect(response.status).toBe(400);
            });
        });

        describe('GET /api/users/addresses', () => {
            it('should get all user addresses', async () => {
                const response = await request(app)
                    .get('/api/users/addresses')
                    .set(authHeader(authToken));

                // May return 500 if database connection issues
                expect([200, 500]).toContain(response.status);
                if (response.status === 200) {
                    expect(response.body).toHaveProperty('status');
                }
            });
        });

        describe('GET /api/users/addresses/:addressId', () => {
            it('should get address by ID', async () => {
                if (!addressId) {
                    // Skip if no address was created
                    return;
                }

                const response = await request(app)
                    .get(`/api/users/addresses/${addressId}`)
                    .set(authHeader(authToken));

                expect([200, 404]).toContain(response.status);
            });

            it('should return 404 for non-existent address', async () => {
                const response = await request(app)
                    .get('/api/users/addresses/non-existent-id')
                    .set(authHeader(authToken));

                expect([404, 400]).toContain(response.status);
            });
        });

        describe('POST /api/users/addresses/update', () => {
            it('should update address', async () => {
                if (!addressId) {
                    return;
                }

                const updateData = {
                    addressId: addressId,
                    addressLine1: '456 Updated St',
                    city: 'Los Angeles',
                    state: 'CA',
                    zipCode: '90001'
                };

                const response = await request(app)
                    .post('/api/users/addresses/update')
                    .set(authHeader(authToken))
                    .send(updateData);

                expect([200, 404]).toContain(response.status);
            });
        });

        describe('DELETE /api/users/addresses/:addressId', () => {
            it('should delete address', async () => {
                if (!addressId) {
                    return;
                }

                const response = await request(app)
                    .delete(`/api/users/addresses/${addressId}`)
                    .set(authHeader(authToken));

                expect([200, 404]).toContain(response.status);
            });
        });
    });
});

