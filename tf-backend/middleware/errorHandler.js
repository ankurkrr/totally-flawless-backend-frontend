/**
 * Centralized Error Handling Middleware
 * Prevents stack trace exposure and handles errors gracefully
 */

const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    // Determine if we're in development mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Log error for debugging (always log, but don't expose to client)
    logger.error('Error:', {
        message: err.message,
        stack: isDevelopment ? err.stack : undefined,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        timestamp: new Date().toISOString()
    });

    // Default error
    let statusCode = err.statusCode || err.status || 500;
    let message = 'Internal server error';
    let details = null;

    // Handle specific error types
    if (err.name === 'ValidationError' || err.isJoi) {
        statusCode = 400;
        message = 'Validation error';
        if (err.details) {
            details = err.details.map(d => ({
                field: d.path?.join('.') || 'unknown',
                message: d.message
            }));
        }
    } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Invalid or expired token';
    } else if (err.name === 'CastError' || err.message?.includes('Invalid ID')) {
        statusCode = 400;
        message = 'Invalid ID format';
    } else if (err.code === 'ER_DUP_ENTRY') {
        statusCode = 409;
        message = 'Duplicate entry - resource already exists';
    } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        statusCode = 400;
        message = 'Referenced resource does not exist';
    } else if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        statusCode = 503;
        message = 'Service temporarily unavailable';
    } else if (err.statusCode) {
        // Use provided status code
        statusCode = err.statusCode;
        message = err.message || message;
    } else if (isDevelopment) {
        // In development, show actual error message
        message = err.message || message;
    }
    // In production, use generic message for 500 errors

    // Build response object
    const response = {
        status: 'error',
        message: message
    };

    // Only include details in development or for validation errors
    if (isDevelopment) {
        response.stack = err.stack;
        if (err.details && !details) {
            response.details = err.details;
        }
    }
    
    if (details) {
        response.errors = details;
    }

    // Send error response
    res.status(statusCode).json(response);
};

/**
 * 404 Not Found Handler
 */
const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        status: 'error',
        message: `Route ${req.method} ${req.originalUrl} not found`
    });
};

module.exports = { errorHandler, notFoundHandler };

