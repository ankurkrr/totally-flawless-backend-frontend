const Joi = require('joi');

/**
 * Get Prices Query Schema
 */
const getPricesQuerySchema = Joi.object({
    serviceId: Joi.string().uuid().required()
        .messages({
            'string.guid': 'serviceId must be a valid UUID',
            'any.required': 'serviceId is required'
        })
}).unknown(false);

/**
 * Get Subcategories Query Schema
 */
const getSubcategoriesQuerySchema = Joi.object({
    serviceId: Joi.string().uuid().required()
        .messages({
            'string.guid': 'serviceId must be a valid UUID',
            'any.required': 'serviceId is required'
        })
}).unknown(false);

/**
 * Get Categories Query Schema (no params needed, but validate empty)
 */
const getCategoriesQuerySchema = Joi.object({}).unknown(false);

module.exports = {
    getPricesQuerySchema,
    getSubcategoriesQuerySchema,
    getCategoriesQuerySchema
};

