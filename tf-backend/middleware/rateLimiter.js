/**
 * @fileoverview Rate Limiting Middleware
 * @description Protects API endpoints from abuse and DDoS attacks
 * @module middleware/rateLimiter
 */

const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * General API rate limiter
 * Limits: 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        status: 'error',
        message: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
        res.status(429).json({
            status: 'error',
            message: 'Too many requests from this IP, please try again later.',
        });
    },
});

/**
 * Strict rate limiter for authentication endpoints
 * Limits: 5 requests per 15 minutes per IP
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        status: 'error',
        message: 'Too many authentication attempts, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Auth rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
        res.status(429).json({
            status: 'error',
            message: 'Too many authentication attempts, please try again later.',
        });
    },
    skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Upload rate limiter
 * Limits: 20 requests per hour per IP
 */
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Limit each IP to 20 uploads per hour
    message: {
        status: 'error',
        message: 'Too many upload requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Upload rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
        res.status(429).json({
            status: 'error',
            message: 'Too many upload requests, please try again later.',
        });
    },
});

/**
 * Payment rate limiter
 * Limits: 10 requests per hour per IP
 */
const paymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 payment requests per hour
    message: {
        status: 'error',
        message: 'Too many payment requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Payment rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
        res.status(429).json({
            status: 'error',
            message: 'Too many payment requests, please try again later.',
        });
    },
});

module.exports = {
    apiLimiter,
    authLimiter,
    uploadLimiter,
    paymentLimiter,
};

