/**
 * Validation Middleware Tests
 * Tests for Joi validation middleware
 */

const Joi = require('joi');
const { validate } = require('../../middleware/validation');

describe('Validation Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {},
            query: {},
            params: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Body Validation', () => {
        const schema = Joi.object({
            name: Joi.string().required(),
            email: Joi.string().email().required(),
            age: Joi.number().integer().min(18).optional()
        });

        it('should pass validation for valid data', () => {
            req.body = {
                name: 'Test User',
                email: 'test@example.com',
                age: 25
            };

            const middleware = validate(schema, 'body');
            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
            expect(req.body.name).toBe('Test User');
            expect(req.body.email).toBe('test@example.com');
        });

        it('should return 400 for missing required fields', () => {
            req.body = {
                name: 'Test User'
                // Missing email
            };

            const middleware = validate(schema, 'body');
            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Validation failed',
                errors: expect.arrayContaining([
                    expect.objectContaining({
                        field: 'email',
                        message: expect.stringContaining('required')
                    })
                ])
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 400 for invalid email format', () => {
            req.body = {
                name: 'Test User',
                email: 'invalid-email'
            };

            const middleware = validate(schema, 'body');
            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Validation failed',
                errors: expect.arrayContaining([
                    expect.objectContaining({
                        field: 'email',
                        message: expect.stringContaining('email')
                    })
                ])
            });
        });

        it('should return 400 for invalid age (below minimum)', () => {
            req.body = {
                name: 'Test User',
                email: 'test@example.com',
                age: 15 // Below minimum of 18
            };

            const middleware = validate(schema, 'body');
            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Validation failed',
                errors: expect.arrayContaining([
                    expect.objectContaining({
                        field: 'age',
                        message: expect.stringContaining('18')
                    })
                ])
            });
        });

        it('should strip unknown fields', () => {
            req.body = {
                name: 'Test User',
                email: 'test@example.com',
                unknownField: 'should be removed',
                anotherUnknown: 123
            };

            const middleware = validate(schema, 'body');
            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.body.unknownField).toBeUndefined();
            expect(req.body.anotherUnknown).toBeUndefined();
        });
    });

    describe('Query Validation', () => {
        const schema = Joi.object({
            page: Joi.number().integer().min(1).optional(),
            limit: Joi.number().integer().min(1).max(100).optional(),
            search: Joi.string().optional()
        });

        it('should validate query parameters', () => {
            req.query = {
                page: '1',
                limit: '10',
                search: 'test'
            };

            const middleware = validate(schema, 'query');
            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.query.page).toBe(1); // Converted to number
            expect(req.query.limit).toBe(10);
        });

        it('should return 400 for invalid query parameters', () => {
            req.query = {
                page: '-1', // Invalid: negative
                limit: '200' // Invalid: exceeds max
            };

            const middleware = validate(schema, 'query');
            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('Params Validation', () => {
        const schema = Joi.object({
            id: Joi.string().uuid().required(),
            type: Joi.string().valid('user', 'artist').optional()
        });

        it('should validate route parameters', () => {
            req.params = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                type: 'user'
            };

            const middleware = validate(schema, 'params');
            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should return 400 for invalid UUID format', () => {
            req.params = {
                id: 'invalid-id',
                type: 'user'
            };

            const middleware = validate(schema, 'params');
            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Validation failed',
                errors: expect.arrayContaining([
                    expect.objectContaining({
                        field: 'id',
                        message: expect.stringMatching(/uuid|GUID|valid/)
                    })
                ])
            });
        });

        it('should return 400 for invalid enum value', () => {
            req.params = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                type: 'invalid-type'
            };

            const middleware = validate(schema, 'params');
            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('Multiple Validation Errors', () => {
        const schema = Joi.object({
            name: Joi.string().required(),
            email: Joi.string().email().required(),
            age: Joi.number().integer().min(18).required()
        });

        it('should return all validation errors', () => {
            req.body = {
                name: '',
                email: 'invalid',
                age: 15
            };

            const middleware = validate(schema, 'body');
            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            const response = res.json.mock.calls[0][0];
            expect(response.errors.length).toBeGreaterThan(1);
        });
    });
});

