const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { validate } = require('../../middleware/validation');
const Joi = require('joi');

// Admin Booking Controllers
const { admingetAllBookingController, admingetBookingByIdController, adminupdateBookingStatusController, getAllTrainingBookingController, updateTrainingBookingController } = require('../../controllers/admin/bookingController');

// Validators
const updateBookingStatusSchema = Joi.object({
    bookingId: Joi.string().uuid().required(),
    status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'completed', 'payment_pending', 'paid').required()
});

const updateTrainingBookingSchema = Joi.object({
    trainingBookingId: Joi.string().uuid().required(),
    status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'completed').required()
});

/**
 * @route   GET /admin/bookings
 * @desc    Get all bookings
 * @access  Private
 */
router.get('/', authenticate, admingetAllBookingController);

/**
 * @route   GET /admin/bookings/:id
 * @desc    Get booking by ID
 * @access  Private
 */
router.get('/:id', authenticate, admingetBookingByIdController);

/**
 * @route   POST /admin/bookings/update-status
 * @desc    Update booking status
 * @access  Private
 */
router.post('/update-status', authenticate, validate(updateBookingStatusSchema), adminupdateBookingStatusController);

/**
 * @route   GET /admin/bookings/training
 * @desc    Get all training bookings
 * @access  Private
 */
router.get('/training', authenticate, getAllTrainingBookingController);

/**
 * @route   POST /admin/bookings/training/update
 * @desc    Update training booking
 * @access  Private
 */
router.post('/training/update', authenticate, validate(updateTrainingBookingSchema), updateTrainingBookingController);

module.exports = router;

