const Joi = require('joi');

/**
 * Add to Cart Schema
 */
const addToCartSchema = Joi.object({
    userId: Joi.string().uuid().required(),
    serviceId: Joi.string().uuid().required(),
    quantity: Joi.number().integer().min(1).max(100).default(1),
    bookingType: Joi.string().valid('home', 'salon', 'virtual').required(),
    bookingTime: Joi.string().trim().required(),
    price: Joi.number().min(0).precision(2).required(),
    longHairAmount: Joi.number().min(0).precision(2).default(0).optional(),
    addOnAmount: Joi.number().min(0).precision(2).default(0).optional(),
    subCategoryId: Joi.string().uuid().optional().allow(null, ''),
    gratuity: Joi.number().min(0).max(1000).precision(2).default(0).optional(),
    artist: Joi.string().trim().max(200).optional().allow(null, ''),
    imageUrl: Joi.string().uri().optional().allow(null, '')
});

/**
 * Update Cart Item Schema
 */
const updateCartItemSchema = Joi.object({
    cartItemId: Joi.string().uuid().required(),
    quantity: Joi.number().integer().min(1).max(100).optional(),
    bookingTime: Joi.string().trim().optional(),
    price: Joi.number().min(0).precision(2).optional(),
    longHairAmount: Joi.number().min(0).precision(2).optional(),
    addOnAmount: Joi.number().min(0).precision(2).optional()
}).min(1);

/**
 * Assign Artist to Cart Items Schema
 */
const assignArtistToCartSchema = Joi.object({
    cartId: Joi.string().uuid().required(),
    cartItemId: Joi.string().uuid().required(),
    artistId: Joi.string().uuid().required(),
    travelFee: Joi.number().min(0).precision(2).default(0).optional()
});

module.exports = {
    addToCartSchema,
    updateCartItemSchema,
    assignArtistToCartSchema
};

