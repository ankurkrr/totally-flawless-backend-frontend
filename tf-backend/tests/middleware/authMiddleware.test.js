/**
 * Authentication Middleware Tests
 * Tests for JWT authentication middleware
 */

const jwt = require('jsonwebtoken');
const { authenticate } = require('../../middleware/authMiddleware');
const KeyProvider = require('../../utils/keyProvider');

// Mock KeyProvider
jest.mock('../../utils/keyProvider');

describe('Authentication Middleware', () => {
    let req, res, next;
    const mockJWTSecret = 'test-secret-key';

    beforeEach(() => {
        req = {
            headers: {},
            user: null
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        
        // Set default JWT_SECRET
        process.env.JWT_SECRET = mockJWTSecret;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Missing Authorization Header', () => {
        it('should return 401 when authorization header is missing', async () => {
            req.headers = {};

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                status: 0,
                message: 'Access token is missing or invalid'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 when authorization header does not start with Bearer', async () => {
            req.headers.authorization = 'Invalid token';

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                status: 0,
                message: 'Access token is missing or invalid'
            });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('Valid Token', () => {
        it('should authenticate valid token and call next', async () => {
            const payload = { userId: 'test-user-id', email: 'test@example.com' };
            const token = jwt.sign(payload, mockJWTSecret, { expiresIn: '1h' });
            req.headers.authorization = `Bearer ${token}`;

            KeyProvider.getAllJWTSecrets.mockResolvedValue([mockJWTSecret]);

            await authenticate(req, res, next);

            expect(req.user).toMatchObject(payload);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should attach user data to request object', async () => {
            const payload = {
                userId: 'test-user-id',
                email: 'test@example.com',
                userType: 'user'
            };
            const token = jwt.sign(payload, mockJWTSecret, { expiresIn: '1h' });
            req.headers.authorization = `Bearer ${token}`;

            KeyProvider.getAllJWTSecrets.mockResolvedValue([mockJWTSecret]);

            await authenticate(req, res, next);

            expect(req.user.userId).toBe('test-user-id');
            expect(req.user.email).toBe('test@example.com');
            expect(req.user.userType).toBe('user');
        });
    });

    describe('Invalid Token', () => {
        it('should return 401 for invalid token', async () => {
            req.headers.authorization = 'Bearer invalid-token';

            KeyProvider.getAllJWTSecrets.mockResolvedValue([mockJWTSecret]);

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                status: 0,
                message: 'Invalid or expired access token'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 for expired token', async () => {
            const payload = { userId: 'test-user-id' };
            const token = jwt.sign(payload, mockJWTSecret, { expiresIn: '-1h' }); // Expired
            req.headers.authorization = `Bearer ${token}`;

            KeyProvider.getAllJWTSecrets.mockResolvedValue([mockJWTSecret]);

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                status: 0,
                message: 'Invalid or expired access token'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 for token signed with different secret', async () => {
            const wrongSecret = 'wrong-secret';
            const payload = { userId: 'test-user-id' };
            const token = jwt.sign(payload, wrongSecret, { expiresIn: '1h' });
            req.headers.authorization = `Bearer ${token}`;

            KeyProvider.getAllJWTSecrets.mockResolvedValue([mockJWTSecret]);

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('KeyProvider Integration', () => {
        it('should use KeyProvider to get JWT secrets', async () => {
            const payload = { userId: 'test-user-id' };
            const token = jwt.sign(payload, mockJWTSecret, { expiresIn: '1h' });
            req.headers.authorization = `Bearer ${token}`;

            KeyProvider.getAllJWTSecrets.mockResolvedValue([mockJWTSecret]);

            await authenticate(req, res, next);

            expect(KeyProvider.getAllJWTSecrets).toHaveBeenCalled();
            expect(next).toHaveBeenCalled();
        });

        it('should fallback to env var when KeyProvider fails', async () => {
            const payload = { userId: 'test-user-id' };
            const token = jwt.sign(payload, mockJWTSecret, { expiresIn: '1h' });
            req.headers.authorization = `Bearer ${token}`;

            KeyProvider.getAllJWTSecrets.mockRejectedValue(new Error('KeyProvider failed'));

            await authenticate(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toMatchObject(payload);
        });

        it('should return 500 when no JWT secrets available', async () => {
            req.headers.authorization = 'Bearer test-token';

            KeyProvider.getAllJWTSecrets.mockRejectedValue(new Error('Failed'));
            delete process.env.JWT_SECRET;

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                status: 0,
                message: 'JWT_SECRET not configured. Please set JWT_SECRET in .env file.'
            });
        });

        it('should try multiple secrets during key rotation', async () => {
            const oldSecret = 'old-secret';
            const newSecret = 'new-secret';
            const payload = { userId: 'test-user-id' };
            const token = jwt.sign(payload, newSecret, { expiresIn: '1h' });
            req.headers.authorization = `Bearer ${token}`;

            KeyProvider.getAllJWTSecrets.mockResolvedValue([oldSecret, newSecret]);

            await authenticate(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toMatchObject(payload);
        });
    });
});

