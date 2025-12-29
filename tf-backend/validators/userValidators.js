const Joi = require('joi');

/**
 * User Registration Validation Schema
 */
const createUserSchema = Joi.object({
    firstName: Joi.string().trim().min(1).max(100).required()
        .messages({
            'string.empty': 'First name is required',
            'string.min': 'First name must be at least 1 character',
            'string.max': 'First name must not exceed 100 characters'
        }),
    lastName: Joi.string().trim().min(1).max(100).required()
        .messages({
            'string.empty': 'Last name is required',
            'string.min': 'Last name must be at least 1 character',
            'string.max': 'Last name must not exceed 100 characters'
        }),
    email: Joi.string().email().trim().lowercase().optional()
        .messages({
            'string.email': 'Please provide a valid email address'
        }),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).required()
        .messages({
            'string.pattern.base': 'Phone number must be 10-15 digits',
            'any.required': 'Phone number is required'
        }),
    address: Joi.string().trim().max(500).optional().allow(null, ''),
    imgUrl: Joi.string().uri().optional().allow(null, ''),
    countryCode: Joi.string().trim().max(10).optional().allow(null, '')
});

/**
 * Get OTP Validation Schema (for requesting OTP)
 * This endpoint GENERATES an OTP, so it doesn't require OTP as input
 */
const getOtpSchema = Joi.object({
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).required()
        .messages({
            'string.pattern.base': 'Phone number must be 10-15 digits',
            'any.required': 'Phone number is required'
        }),
    countryCode: Joi.string().pattern(/^\+?[0-9]{1,4}$/).optional()
        .messages({
            'string.pattern.base': 'Country code must be 1-4 digits (e.g., 1, 91, +1)'
        })
});

/**
 * OTP Verification Validation Schema (for verifying OTP)
 * This endpoint VERIFIES an OTP, so it requires OTP as input
 */
const verifyOtpSchema = Joi.object({
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).required()
        .messages({
            'string.pattern.base': 'Phone number must be 10-15 digits',
            'any.required': 'Phone number is required'
        }),
    countryCode: Joi.string().pattern(/^\+?[0-9]{1,4}$/).required()
        .messages({
            'string.pattern.base': 'Country code must be 1-4 digits (e.g., 1, 91, +1)',
            'any.required': 'Country code is required'
        }),
    otp: Joi.string().pattern(/^[0-9]{4,6}$/).required()
        .messages({
            'string.pattern.base': 'OTP must be 4-6 digits',
            'any.required': 'OTP is required'
        })
});

/**
 * Update User Validation Schema
 */
const updateUserSchema = Joi.object({
    firstName: Joi.string().trim().min(1).max(100).optional(),
    lastName: Joi.string().trim().min(1).max(100).optional(),
    email: Joi.string().email().trim().lowercase().optional(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional(),
    address: Joi.string().trim().max(500).optional().allow(null, ''),
    imgUrl: Joi.string().uri().optional().allow(null, ''),
    countryCode: Joi.string().trim().max(10).optional().allow(null, '')
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});

/**
 * Update User Gratuity Schema
 */
const updateUserGratuitySchema = Joi.object({
    userId: Joi.string().uuid().required(),
    gratuity: Joi.number().min(0).max(1000).optional()
});

/**
 * Check Email Exists Schema
 */
const checkEmailSchema = Joi.object({
    email: Joi.string().email().trim().lowercase().required()
});

module.exports = {
    createUserSchema,
    getOtpSchema,
    verifyOtpSchema,
    updateUserSchema,
    updateUserGratuitySchema,
    checkEmailSchema
};

