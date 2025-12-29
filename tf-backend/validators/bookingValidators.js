const Joi = require('joi');

/**
 * Create Booking Schema
 */
const createBookingSchema = Joi.object({
    userId: Joi.string().uuid().required(),
    cartId: Joi.string().uuid().required()
});

/**
 * Confirm Booking Schema
 */
const confirmBookingSchema = Joi.object({
    transactionId: Joi.string().uuid().required(),
    bookingId: Joi.string().uuid().required()
});

/**
 * Cancel/Complete Booking Schema
 */
const updateBookingStatusSchema = Joi.object({
    artistId: Joi.string().uuid().required(),
    bookingItemId: Joi.string().uuid().required(),
    status: Joi.string().valid('cancelled', 'completed').required()
});

/**
 * Update Gratuity Schema
 */
const updateGratuitySchema = Joi.object({
    bookingItemId: Joi.string().uuid().required(),
    gratuity: Joi.number().min(0).max(1000).required()
});

/**
 * Add Rating Schema
 */
const addRatingSchema = Joi.object({
    bookingItemId: Joi.string().uuid().required(),
    rating: Joi.number().integer().min(1).max(5).required()
});

/**
 * User Cancel Booking Schema
 */
const userCancelBookingSchema = Joi.object({
    bookingId: Joi.string().uuid().required(),
    reason: Joi.string().trim().max(500).optional()
});

/**
 * Artist Booking Status Change Schema
 */
const artistBookingStatusSchema = Joi.object({
    bookingItemId: Joi.string().uuid().required(),
    status: Joi.string().valid('accepted', 'declined', 'cancelled', 'completed').required()
});

/**
 * Assign Booking to Artist Schema
 */
const assignBookingSchema = Joi.object({
    bookingId: Joi.string().uuid().required(),
    artistId: Joi.string().uuid().required()
});

/**
 * Get Bookings Query Parameters Schema
 */
const getBookingsQuerySchema = Joi.object({
    bookingId: Joi.string().uuid().optional(),
    status: Joi.string().valid('pending', 'confirmed', 'completed', 'cancelled', 'payment_pending').optional(),
    bookingType: Joi.string().valid('now', 'later').optional(),
    businessType: Joi.string().optional(),
    bookingitemstatus: Joi.string().valid('pending', 'confirmed', 'completed', 'cancelled', 'payment_pending').optional()
});

/**
 * Booking ID Parameter Schema
 */
const bookingIdParamSchema = Joi.object({
    bookingId: Joi.string().uuid().required()
}).unknown(false);

/**
 * Booking Type Counts Query Schema
 */
const bookingTypeCountsQuerySchema = Joi.object({
    // No query params needed - uses authenticated user
}).unknown(false);

module.exports = {
    createBookingSchema,
    confirmBookingSchema,
    updateBookingStatusSchema,
    updateGratuitySchema,
    addRatingSchema,
    userCancelBookingSchema,
    artistBookingStatusSchema,
    assignBookingSchema,
    getBookingsQuerySchema,
    bookingIdParamSchema,
    bookingTypeCountsQuerySchema
};

