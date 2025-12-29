const Joi = require('joi');

/**
 * Request Temporary Credentials Validation Schema
 */
const requestCredentialsSchema = Joi.object({
    purpose: Joi.string()
        .valid('PROFILE_IMAGE', 'BOOKING_MEDIA')
        .required()
        .messages({
            'any.only': 'Purpose must be either PROFILE_IMAGE or BOOKING_MEDIA',
            'any.required': 'Purpose is required'
        })
});

/**
 * Complete Upload Validation Schema
 */
const completeUploadSchema = Joi.object({
    s3Key: Joi.string()
        .trim()
        .min(1)
        .max(500)
        .pattern(/^users\/[a-zA-Z0-9_-]+\/(profile|bookings)\/.+$/)
        .required()
        .messages({
            'string.empty': 'S3 key is required',
            'string.min': 'S3 key must be at least 1 character',
            'string.max': 'S3 key must not exceed 500 characters',
            'string.pattern.base': 'S3 key must be in format: users/{userId}/{purpose}/filename',
            'any.required': 'S3 key is required'
        }),
    purpose: Joi.string()
        .valid('PROFILE_IMAGE', 'BOOKING_MEDIA')
        .required()
        .messages({
            'any.only': 'Purpose must be either PROFILE_IMAGE or BOOKING_MEDIA',
            'any.required': 'Purpose is required'
        }),
    fileName: Joi.string()
        .trim()
        .max(255)
        .optional()
        .allow(null, ''),
    fileSize: Joi.number()
        .integer()
        .min(0)
        .max(250 * 1024 * 1024) // 250 MB max
        .optional()
        .allow(null),
    contentType: Joi.string()
        .trim()
        .max(100)
        .optional()
        .allow(null, '')
});

module.exports = {
    requestCredentialsSchema,
    completeUploadSchema
};

