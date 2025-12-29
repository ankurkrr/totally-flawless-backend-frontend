const Joi = require('joi');

/**
 * UUID Parameter Schema (for URL params)
 */
const uuidParamSchema = (paramName = 'id') => {
    const schema = {};
    schema[paramName] = Joi.string().uuid().required()
        .messages({
            'string.guid': `${paramName} must be a valid UUID`,
            'any.required': `${paramName} is required`
        });
    return Joi.object(schema).unknown(false);
};

/**
 * Delete User Schema
 */
const deleteUserSchema = Joi.object({
    confirm: Joi.boolean().valid(true).required()
        .messages({
            'any.only': 'Account deletion must be confirmed',
            'any.required': 'Confirmation is required'
        }),
    password: Joi.string().min(1).optional()
}).unknown(false);

/**
 * Pagination Query Schema
 */
const paginationQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(20).optional(),
    offset: Joi.number().integer().min(0).default(0).optional()
}).unknown(false);

/**
 * Sort Query Schema
 */
const sortQuerySchema = Joi.object({
    sortBy: Joi.string().trim().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc').optional()
}).unknown(false);

module.exports = {
    uuidParamSchema,
    deleteUserSchema,
    paginationQuerySchema,
    sortQuerySchema
};

