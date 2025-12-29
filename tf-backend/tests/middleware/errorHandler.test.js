/**
 * Error Handler Middleware Tests
 * Tests for centralized error handling
 */

const { errorHandler, notFoundHandler } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger');

jest.mock('../../utils/logger');

describe('Error Handler Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            originalUrl: '/api/test',
            method: 'GET',
            ip: '127.0.0.1'
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        
        process.env.NODE_ENV = 'test';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Generic Errors', () => {
        it('should handle generic errors with 500 status', () => {
            const error = new Error('Something went wrong');

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Internal server error'
            });
            expect(logger.error).toHaveBeenCalled();
        });

        it('should include stack trace in development mode', () => {
            process.env.NODE_ENV = 'development';
            const error = new Error('Test error');

            errorHandler(error, req, res, next);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'error',
                    stack: expect.any(String)
                })
            );
        });

        it('should not include stack trace in production mode', () => {
            process.env.NODE_ENV = 'production';
            const error = new Error('Test error');

            errorHandler(error, req, res, next);

            const response = res.json.mock.calls[0][0];
            expect(response.stack).toBeUndefined();
        });
    });

    describe('Validation Errors', () => {
        it('should handle Joi validation errors', () => {
            const error = {
                name: 'ValidationError',
                isJoi: true,
                details: [
                    {
                        path: ['email'],
                        message: 'Email is required'
                    },
                    {
                        path: ['name'],
                        message: 'Name must be a string'
                    }
                ]
            };

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Validation error',
                errors: [
                    { field: 'email', message: 'Email is required' },
                    { field: 'name', message: 'Name must be a string' }
                ]
            });
        });
    });

    describe('Authentication Errors', () => {
        it('should handle JWT errors', () => {
            const error = {
                name: 'JsonWebTokenError',
                message: 'Invalid token'
            };

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Invalid or expired token'
            });
        });

        it('should handle token expired errors', () => {
            const error = {
                name: 'TokenExpiredError',
                message: 'Token expired'
            };

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Invalid or expired token'
            });
        });

        it('should handle unauthorized errors', () => {
            const error = {
                name: 'UnauthorizedError',
                message: 'Unauthorized'
            };

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    describe('Database Errors', () => {
        it('should handle duplicate entry errors', () => {
            const error = {
                code: 'ER_DUP_ENTRY',
                message: 'Duplicate entry'
            };

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Duplicate entry - resource already exists'
            });
        });

        it('should handle foreign key constraint errors', () => {
            const error = {
                code: 'ER_NO_REFERENCED_ROW_2',
                message: 'Foreign key constraint failed'
            };

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Referenced resource does not exist'
            });
        });
    });

    describe('Network Errors', () => {
        it('should handle connection refused errors', () => {
            const error = {
                code: 'ECONNREFUSED',
                message: 'Connection refused'
            };

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(503);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Service temporarily unavailable'
            });
        });

        it('should handle timeout errors', () => {
            const error = {
                code: 'ETIMEDOUT',
                message: 'Request timeout'
            };

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(503);
        });
    });

    describe('Custom Status Codes', () => {
        it('should use custom status code from error', () => {
            const error = {
                statusCode: 404,
                message: 'Resource not found'
            };

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Resource not found'
            });
        });
    });

    describe('Not Found Handler', () => {
        it('should return 404 for unknown routes', () => {
            req.method = 'GET';
            req.originalUrl = '/api/unknown-route';

            notFoundHandler(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Route GET /api/unknown-route not found'
            });
        });

        it('should include method and URL in error message', () => {
            req.method = 'POST';
            req.originalUrl = '/api/users/123';

            notFoundHandler(req, res, next);

            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Route POST /api/users/123 not found'
            });
        });
    });

    describe('Error Logging', () => {
        it('should log errors with context', () => {
            const error = new Error('Test error');

            errorHandler(error, req, res, next);

            const errorCall = logger.error.mock.calls[0];
            expect(errorCall[0]).toBe('Error:');
            expect(errorCall[1]).toMatchObject({
                message: 'Test error',
                url: '/api/test',
                method: 'GET',
                ip: '127.0.0.1',
                timestamp: expect.any(String)
            });
            // Stack may be undefined in test environment
            if (errorCall[1].stack) {
                expect(typeof errorCall[1].stack).toBe('string');
            }
        });
    });
});

