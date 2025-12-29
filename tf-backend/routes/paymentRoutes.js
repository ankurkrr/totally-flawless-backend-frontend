/**
 * @fileoverview Payment Routes
 * @description Defines all payment-related API endpoints
 * @module routes/paymentRoutes
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();

// ============================================================================
// MIDDLEWARE IMPORTS
// ============================================================================
const { authenticate } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validation');
const { paymentLimiter } = require('../middleware/rateLimiter');

// ============================================================================
// CONTROLLER IMPORTS
// ============================================================================
const { 
    makeGratuityPayment, 
    payBookingBalance, 
    payMultipleBookings, 
    updateMultipleBookingsPayment 
} = require('../controllers/paymentController');

// Validators
const { makePaymentSchema, bookingUpdateAndPaymentSchema, bookingPaymentSchema, updateBookingAmountPaidSchema } = require('../validators/paymentValidators');

/**
 * @route   POST /api/payments/gratuity
 * @desc    Make gratuity payment
 * @access  Private
 */
router.post('/gratuity', paymentLimiter, authenticate, validate(makePaymentSchema), makeGratuityPayment);

/**
 * @route   POST /api/payments/booking
 * @desc    Update booking and process payment (Balance Payment)
 * @access  Private
 */
router.post('/booking', paymentLimiter, authenticate, validate(bookingUpdateAndPaymentSchema), payBookingBalance);

/**
 * @route   POST /api/payments/booking-payment
 * @desc    Process bulk booking payment
 * @access  Private
 */
router.post('/booking-payment', paymentLimiter, authenticate, validate(bookingPaymentSchema), payMultipleBookings);

/**
 * @route   POST /api/payments/booking-amount-paid
 * @desc    Update booking amount paid (After bulk payment)
 * @access  Private
 */
router.post('/booking-amount-paid', paymentLimiter, authenticate, validate(updateBookingAmountPaidSchema), updateMultipleBookingsPayment);

module.exports = router;

