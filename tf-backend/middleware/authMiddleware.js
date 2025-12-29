require('dotenv').config();
const jwt = require('jsonwebtoken');
const KeyProvider = require('../utils/keyProvider');

/**
 * Authentication middleware with JWT token validation
 * Supports multiple active keys during grace period for zero-downtime rotation
 */
module.exports.authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ status: 0, message: 'Access token is missing or invalid' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Get all active JWT secrets (supports grace period during rotation)
        let jwtSecrets;
        try {
            jwtSecrets = await KeyProvider.getAllJWTSecrets();
        } catch (error) {
            // Final fallback - use env var directly
            // Suppress warning in test environment (expected behavior)
            if (process.env.NODE_ENV !== 'test') {
                console.warn('⚠️  KeyProvider failed, using JWT_SECRET directly from environment variables.');
            }
            const envSecret = process.env.JWT_SECRET;
            if (!envSecret) {
                return res.status(500).json({
                    status: 0,
                    message: 'JWT_SECRET not configured. Please set JWT_SECRET in .env file.'
                });
            }
            jwtSecrets = [envSecret];
        }

        if (!jwtSecrets || jwtSecrets.length === 0) {
            return res.status(500).json({
                status: 0,
                message: 'JWT secrets not configured'
            });
        }

        // Try to verify token with each active secret (for grace period support)
        let decoded = null;
        let lastError = null;

        for (const secret of jwtSecrets) {
            try {
                decoded = jwt.verify(token, secret);
                break; // Successfully verified
            } catch (err) {
                lastError = err;
                continue; // Try next secret
            }
        }

        if (!decoded) {
            // None of the secrets worked
            console.error('JWT verification failed:', lastError?.message);
            return res.status(401).json({
                status: 0,
                message: 'Invalid or expired access token'
            });
        }

        req.user = decoded; // Attach user info to the request object
        console.log(`[AUTH SUCCESS] User: ${decoded.id} (${decoded.email})`);
        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(401).json({ status: 0, message: 'Invalid or expired access token' });
    }
};
