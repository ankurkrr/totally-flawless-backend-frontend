/**
 * Token Service Unit Tests
 * Tests for token generation service
 * 
 * NOTE: This service is tightly coupled to the database and HTTP layer.
 * Consider refactoring to separate business logic for better unit testing.
 */

const tokenService = require('../../../services/tokenService');
const conn = require('../../../connection/database');
const jwt = require('jsonwebtoken');
const KeyProvider = require('../../../utils/keyProvider');

// Mock dependencies
jest.mock('../../../connection/database', () => {
    const mockQueryFn = jest.fn();
    return {
        query: jest.fn((query, params, callback) => {
            if (callback) {
                callback(null, []);
            }
            return mockQueryFn;
        })
    };
});

jest.mock('../../../utils/keyProvider');

// Increase timeout for all tests in this file (database mocking can be slow)
jest.setTimeout(30000);

describe('TokenService', () => {
    let req, res;
    const mockJWTSecret = 'test-secret-key';
    let mockPromisify;

    beforeEach(() => {
        req = {
            body: {},
            user: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        // Mock the database query function that promisify will wrap
        // The service uses: const query = promisify(conn.query).bind(conn);
        // So we need to mock conn.query to return a function that can be promisified
        conn.query.mockImplementation((sql, params, callback) => {
            if (callback) {
                // Callback style - for promisify
                callback(null, []);
            }
            // Return promise-like object
            return Promise.resolve([[]]);
        });

        KeyProvider.getJWTSecret.mockResolvedValue(mockJWTSecret);
        process.env.JWT_SECRET = mockJWTSecret;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('CreateToken - Phone Format', () => {
        it('should create token with phone and valid OTP', async () => {
            const mockUser = {
                id: 'user-123',
                phone: '+1234567890',
                otp: '123456'
            };

            // Mock database query to return user
            conn.query.mockImplementationOnce((sql, params, callback) => {
                if (callback) {
                    callback(null, [mockUser]);
                }
                return Promise.resolve([mockUser]);
            });

            req.body = {
                phone: '+1234567890',
                otp: '123456'
            };

            await tokenService.CreateToken(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'success',
                    data: expect.objectContaining({
                        accessToken: expect.any(String)
                    })
                })
            );
        }, 15000); // Increase timeout

        it('should return 404 when user not found by phone', async () => {
            // Mock database query to return empty array
            conn.query.mockImplementationOnce((sql, params, callback) => {
                if (callback) {
                    callback(null, []);
                }
                return Promise.resolve([]);
            });

            req.body = {
                phone: '+1234567890',
                otp: '123456'
            };

            await tokenService.CreateToken(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'User not found'
            });
        }, 15000);

        it('should return 400 when OTP does not match', async () => {
            const mockUser = {
                id: 'user-123',
                phone: '+1234567890',
                otp: '123456'
            };

            // Mock database query to return user
            conn.query.mockImplementationOnce((sql, params, callback) => {
                if (callback) {
                    callback(null, [mockUser]);
                }
                return Promise.resolve([mockUser]);
            });

            req.body = {
                phone: '+1234567890',
                otp: 'wrong-otp'
            };

            await tokenService.CreateToken(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'OTP does not match.'
            });
        });
    });

    describe('CreateToken - ID Format', () => {
        it('should create token for user type 1', async () => {
            const mockUser = {
                id: 'user-123',
                phone: '+1234567890',
                otp: '123456'
            };

            conn.query.mockImplementationOnce((sql, params, callback) => {
                if (callback) {
                    callback(null, [mockUser]);
                }
                return Promise.resolve([mockUser]);
            });

            req.body = {
                id: 'user-123',
                userType: 1,
                otp: '123456'
            };

            await tokenService.CreateToken(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should create token for artist type', async () => {
            const mockArtist = {
                id: 'artist-123',
                mobile: '+1234567890',
                otp: '123456'
            };

            conn.query.mockImplementationOnce((sql, params, callback) => {
                if (callback) {
                    callback(null, [mockArtist]);
                }
                return Promise.resolve([mockArtist]);
            });

            req.body = {
                id: 'artist-123',
                userType: 2,
                otp: '123456'
            };

            await tokenService.CreateToken(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('CreateToken - Validation', () => {
        it('should return 400 when phone or id+userType missing', async () => {
            req.body = {
                otp: '123456'
            };

            await tokenService.CreateToken(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Either (phone) or (id + userType) is required'
            });
        });

        it('should return 400 when OTP is missing', async () => {
            req.body = {
                phone: '+1234567890'
            };

            await tokenService.CreateToken(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'OTP is required'
            });
        });
    });

    describe('CreateToken - KeyProvider Integration', () => {
        it('should use KeyProvider to get JWT secret', async () => {
            const mockUser = {
                id: 'user-123',
                phone: '+1234567890',
                otp: '123456'
            };

            conn.query.mockImplementationOnce((sql, params, callback) => {
                if (callback) {
                    callback(null, [mockUser]);
                }
                return Promise.resolve([mockUser]);
            });

            req.body = {
                phone: '+1234567890',
                otp: '123456'
            };

            await tokenService.CreateToken(req, res);

            expect(KeyProvider.getJWTSecret).toHaveBeenCalled();
        });

        it('should fallback to env var when KeyProvider fails', async () => {
            const mockUser = {
                id: 'user-123',
                phone: '+1234567890',
                otp: '123456'
            };

            conn.query.mockImplementationOnce((sql, params, callback) => {
                if (callback) {
                    callback(null, [mockUser]);
                }
                return Promise.resolve([mockUser]);
            });

            KeyProvider.getJWTSecret.mockRejectedValue(new Error('KeyProvider failed'));

            req.body = {
                phone: '+1234567890',
                otp: '123456'
            };

            await tokenService.CreateToken(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 500 when no JWT secret available', async () => {
            const mockUser = {
                id: 'user-123',
                phone: '+1234567890',
                otp: '123456'
            };

            conn.query.mockImplementationOnce((sql, params, callback) => {
                if (callback) {
                    callback(null, [mockUser]);
                }
                return Promise.resolve([mockUser]);
            });

            KeyProvider.getJWTSecret.mockRejectedValue(new Error('Failed'));
            const originalSecret = process.env.JWT_SECRET;
            delete process.env.JWT_SECRET;

            req.body = {
                phone: '+1234567890',
                otp: '123456'
            };

            await tokenService.CreateToken(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: expect.stringContaining('JWT_SECRET not found')
            });

            // Restore
            process.env.JWT_SECRET = originalSecret;
        });
    });

    describe('CreateToken - Token Generation', () => {
        it('should generate valid JWT token', async () => {
            const mockUser = {
                id: 'user-123',
                phone: '+1234567890',
                otp: '123456'
            };

            conn.query.mockImplementationOnce((sql, params, callback) => {
                if (callback) {
                    callback(null, [mockUser]);
                }
                return Promise.resolve([mockUser]);
            });

            req.body = {
                phone: '+1234567890',
                otp: '123456'
            };

            await tokenService.CreateToken(req, res);

            expect(res.json).toHaveBeenCalled();
            const response = res.json.mock.calls[0][0];
            expect(response).toHaveProperty('data');
            expect(response.data).toHaveProperty('accessToken');
            
            const token = response.data.accessToken;
            // Verify token can be decoded
            const decoded = jwt.verify(token, mockJWTSecret);
            expect(decoded.id).toBe('user-123');
            expect(decoded.userId).toBe('user-123');
        });

        it('should include user data in response', async () => {
            const mockUser = {
                id: 'user-123',
                phone: '+1234567890',
                otp: '123456',
                firstName: 'John',
                lastName: 'Doe'
            };

            conn.query.mockImplementationOnce((sql, params, callback) => {
                if (callback) {
                    callback(null, [mockUser]);
                }
                return Promise.resolve([mockUser]);
            });

            req.body = {
                phone: '+1234567890',
                otp: '123456'
            };

            await tokenService.CreateToken(req, res);

            expect(res.json).toHaveBeenCalled();
            const response = res.json.mock.calls[0][0];
            expect(response.data).toMatchObject({
                _id: 'user-123',
                id: 'user-123',
                phone: '+1234567890',
                firstName: 'John',
                lastName: 'Doe'
            });
        });
    });
});

