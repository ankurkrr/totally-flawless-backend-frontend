const Joi = require('joi');

/**
 * Add Address Schema
 */
const addAddressSchema = Joi.object({
    userId: Joi.string().uuid().required(),
    address: Joi.string().trim().min(1).max(500).required(),
    city: Joi.string().trim().min(1).max(100).required(),
    state: Joi.string().trim().min(1).max(100).required(),
    zipcode: Joi.string().trim().pattern(/^[0-9]{5}(-[0-9]{4})?$/).optional()
        .messages({
            'string.pattern.base': 'Zipcode must be in format 12345 or 12345-6789'
        }),
    geocode: Joi.string().trim().max(200).optional().allow(null, '')
});

/**
 * Update Address Schema
 */
const updateAddressSchema = Joi.object({
    addressId: Joi.string().uuid().required(),
    address: Joi.string().trim().min(1).max(500).optional(),
    city: Joi.string().trim().min(1).max(100).optional(),
    state: Joi.string().trim().min(1).max(100).optional(),
    zipcode: Joi.string().trim().pattern(/^[0-9]{5}(-[0-9]{4})?$/).optional(),
    geocode: Joi.string().trim().max(200).optional().allow(null, '')
}).min(1);

/**
 * Get Address by ID Schema
 */
const getAddressByIdSchema = Joi.object({
    addressId: Joi.string().uuid().required()
});

module.exports = {
    addAddressSchema,
    updateAddressSchema,
    getAddressByIdSchema
};

