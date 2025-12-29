/**
 * Error Utility Functions
 * Provides safe error handling and sanitization
 */

/**
 * Sanitize error message for client response
 * Prevents exposure of sensitive information
 * 
 * @param {Error} err - Error object
 * @param {boolean} isDevelopment - Whether in development mode
 * @returns {string} - Sanitized error message
 */
const sanitizeErrorMessage = (err, isDevelopment = false) => {
    if (isDevelopment) {
        return err.message || 'An error occurred';
    }

    // In production, return generic messages
    if (err.code === 'ER_DUP_ENTRY') {
        return 'Resource already exists';
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return 'Referenced resource does not exist';
    }
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        return 'Service temporarily unavailable';
    }
    if (err.name === 'ValidationError' || err.isJoi) {
        return 'Validation error';
    }
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return 'Invalid or expired token';
    }

    // Default generic message
    return 'An error occurred while processing your request';
};

/**
 * Create standardized error response
 * 
 * @param {Error} err - Error object
 * @param {number} statusCode - HTTP status code
 * @param {boolean} isDevelopment - Whether in development mode
 * @returns {object} - Error response object
 */
const createErrorResponse = (err, statusCode = 500, isDevelopment = false) => {
    const response = {
        status: 'error',
        message: sanitizeErrorMessage(err, isDevelopment)
    };

    if (isDevelopment && err.stack) {
        response.stack = err.stack;
    }

    if (err.details && (isDevelopment || err.name === 'ValidationError')) {
        response.errors = Array.isArray(err.details) 
            ? err.details 
            : [err.details];
    }

    return response;
};

/**
 * Handle database errors safely
 * 
 * @param {Error} err - Database error
 * @param {object} res - Express response object
 * @param {string} context - Context description for logging
 */
const handleDatabaseError = (err, res, context = 'Database operation') => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    console.error(`${context} error:`, {
        message: err.message,
        code: err.code,
        stack: isDevelopment ? err.stack : undefined
    });

    let statusCode = 500;
    let message = 'Database operation failed';

    if (err.code === 'ER_DUP_ENTRY') {
        statusCode = 409;
        message = 'Resource already exists';
    } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        statusCode = 400;
        message = 'Referenced resource does not exist';
    } else if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        statusCode = 503;
        message = 'Database service temporarily unavailable';
    } else if (isDevelopment) {
        message = err.message;
    }

    res.status(statusCode).json({
        status: 'error',
        message: message
    });
};

module.exports = {
    sanitizeErrorMessage,
    createErrorResponse,
    handleDatabaseError
};

