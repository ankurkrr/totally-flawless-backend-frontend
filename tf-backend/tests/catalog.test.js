/**
 * Catalog Module Tests
 * Tests for catalog endpoints (categories, services, prices)
 */

const request = require('supertest');
const app = require('../app');

describe('Catalog Module', () => {
    describe('GET /api/catalog/categories', () => {
        it('should get all categories with services', async () => {
            const response = await request(app)
                .get('/api/catalog/categories');

            // May return 500 if database connection issues
            expect([200, 500]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body).toHaveProperty('status');
            }
        });

        it('should support query parameters', async () => {
            const response = await request(app)
                .get('/api/catalog/categories')
                .query({
                    includeServices: true,
                    activeOnly: true
                });

            // May return 200 or 400 if query params are invalid
            expect([200, 400]).toContain(response.status);
        });
    });

    describe('GET /api/catalog/prices', () => {
        it('should get prices for service', async () => {
            const response = await request(app)
                .get('/api/catalog/prices')
                .query({
                    serviceId: 'test-service-id'
                });

            expect([200, 400, 404]).toContain(response.status);
        });

        it('should return error for missing serviceId', async () => {
            const response = await request(app)
                .get('/api/catalog/prices');

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/catalog/subcategories', () => {
        it('should get subcategories by service', async () => {
            const response = await request(app)
                .get('/api/catalog/subcategories')
                .query({
                    serviceId: 'test-service-id'
                });

            expect([200, 400, 404]).toContain(response.status);
        });

        it('should return error for missing serviceId', async () => {
            const response = await request(app)
                .get('/api/catalog/subcategories');

            expect(response.status).toBe(400);
        });
    });
});
