const Joi = require('joi');

/**
 * Artist Registration Validation Schema
 */
const createArtistSchema = Joi.object({
    firstName: Joi.string().trim().min(1).max(100).optional().allow(null, ''),
    lastName: Joi.string().trim().min(1).max(100).optional().allow(null, ''),
    email: Joi.string().email().trim().lowercase().optional().allow(null, ''),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).required()
        .messages({
            'string.pattern.base': 'Phone number must be 10-15 digits',
            'any.required': 'Phone number is required'
        }),
    address: Joi.string().trim().max(500).optional().allow(null, ''),
    geocode: Joi.string().trim().max(200).optional().allow(null, ''),
    city: Joi.string().trim().max(100).optional().allow(null, ''),
    state: Joi.string().trim().max(100).optional().allow(null, ''),
    businessType: Joi.number().integer().optional().allow(null),
    videoUrl: Joi.string().uri().optional().allow(null, ''),
    countryCode: Joi.string().trim().max(10).optional().allow(null, '')
});

/**
 * Update Artist Schema
 */
const updateArtistSchema = Joi.object({
    firstName: Joi.string().trim().min(1).max(100).optional(),
    lastName: Joi.string().trim().min(1).max(100).optional(),
    email: Joi.string().email().trim().lowercase().optional(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional(),
    address: Joi.string().trim().max(500).optional().allow(null, ''),
    geocode: Joi.string().trim().max(200).optional().allow(null, ''),
    city: Joi.string().trim().max(100).optional().allow(null, ''),
    state: Joi.string().trim().max(100).optional().allow(null, ''),
    businessType: Joi.number().integer().optional().allow(null),
    videoUrl: Joi.string().uri().optional().allow(null, ''),
    countryCode: Joi.string().trim().max(10).optional().allow(null, '')
}).min(1);

/**
 * Artist Location Schema
 */
const artistLocationSchema = Joi.object({
    artistId: Joi.string().uuid().required(),
    geocode: Joi.string().trim().max(200).required(),
    city: Joi.string().trim().max(100).optional(),
    state: Joi.string().trim().max(100).optional(),
    address: Joi.string().trim().max(500).optional()
});

/**
 * Get Artist OTP Validation Schema (for requesting OTP)
 * This endpoint GENERATES an OTP, so it doesn't require OTP as input
 */
const getArtistOtpSchema = Joi.object({
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).required()
        .messages({
            'string.pattern.base': 'Phone number must be 10-15 digits',
            'any.required': 'Phone number is required'
        }),
    countryCode: Joi.string().pattern(/^\+?[0-9]{1,4}$/).required()
        .messages({
            'string.pattern.base': 'Country code must be 1-4 digits (e.g., 1, 91, +1)',
            'any.required': 'Country code is required'
        })
});

/**
 * Artist OTP Verification Schema (for verifying OTP)
 * This endpoint VERIFIES an OTP, so it requires OTP as input
 */
const verifyArtistOtpSchema = Joi.object({
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
 * Get Artist Bookings Query Schema
 */
const getArtistBookingsQuerySchema = Joi.object({
    artistId: Joi.string().uuid().required(),
    status: Joi.string().valid('pending', 'confirmed', 'completed', 'cancelled', 'payment_pending').optional(),
    bookingType: Joi.string().valid('now', 'later').optional(),
    bookingitemstatus: Joi.string().valid('pending', 'confirmed', 'completed', 'cancelled', 'payment_pending').optional()
});

/**
 * Artist Location ID Parameter Schema
 */
const artistLocationIdParamSchema = Joi.object({
    id: Joi.string().uuid().required()
}).unknown(false);

/**
 * Artist ID Query Schema
 */
const artistIdQuerySchema = Joi.object({
    artistId: Joi.string().uuid().required()
}).unknown(false);

/**
 * Update Artist Video Schema
 */
const updateArtistVideoSchema = Joi.object({
    videoUrl: Joi.string().uri().required()
        .messages({
            'string.uri': 'Video URL must be a valid URL'
        })
});

/**
 * Artist Approve Schema
 */
const artistApproveSchema = Joi.object({
    artistId: Joi.string().uuid().required()
});

/**
 * Artist Available Schema
 */
const artistAvailableSchema = Joi.object({
    artistId: Joi.string().uuid().required(),
    isAvailable: Joi.boolean().required()
});

module.exports = {
    createArtistSchema,
    updateArtistSchema,
    artistLocationSchema,
    getArtistOtpSchema,
    verifyArtistOtpSchema,
    getArtistBookingsQuerySchema,
    artistLocationIdParamSchema,
    artistIdQuerySchema,
    updateArtistVideoSchema,
    artistApproveSchema,
    artistAvailableSchema
};

