const Joi = require('joi');

/**
 * Make Payment Schema (Gratuity)
 */
const makePaymentSchema = Joi.object({
    bookingId: Joi.string().uuid().required(),
    userId: Joi.string().uuid().required(),
    gratuityAmount: Joi.number().min(0.01).max(1000).precision(2).required()
        .messages({
            'number.min': 'Gratuity amount must be at least $0.01',
            'number.max': 'Gratuity amount cannot exceed $1000'
        }),
    BookingItemId: Joi.string().uuid().required()
});

/**
 * Booking Update and Payment Schema
 */
const bookingUpdateAndPaymentSchema = Joi.object({
    bookingId: Joi.string().uuid().required(),
    totalAmount: Joi.number().min(0).precision(2).required(),
    amountPaid: Joi.number().min(0).precision(2).required()
        .messages({
            'number.min': 'Amount paid must be positive'
        })
});

/**
 * Booking Payment Schema
 */
const bookingPaymentSchema = Joi.object({
    bookingId: Joi.string().uuid().required(),
    amount: Joi.number().min(0.01).precision(2).required()
});

/**
 * Update Booking Amount Paid Schema
 */
const updateBookingAmountPaidSchema = Joi.object({
    bookingId: Joi.string().uuid().required(),
    amountPaid: Joi.number().min(0).precision(2).required()
});

module.exports = {
    makePaymentSchema,
    bookingUpdateAndPaymentSchema,
    bookingPaymentSchema,
    updateBookingAmountPaidSchema
};

