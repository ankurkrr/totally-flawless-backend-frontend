const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validation');

// Booking Controllers
const { createBooking, getBooking, getUserBookings, addGratuity, addRating } = require('../controllers/bookingController');
// Legacy / Not yet refactored controllers
const { confirmBookingController } = require('../controllers/createBookingsController');
const { getTotalGratuityCategoryWiseController, UserCancelBookingController, UserDeleteUpcomingBookingController, getBookingtypeCountsController } = require('../controllers/getBookingsController');

// Validators
const { createBookingSchema, confirmBookingSchema, updateGratuitySchema, addRatingSchema, userCancelBookingSchema, getBookingsQuerySchema, bookingIdParamSchema, bookingTypeCountsQuerySchema } = require('../validators/bookingValidators');

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking
 * @access  Private
 */
router.post('/', authenticate, validate(createBookingSchema), createBooking);

/**
 * @route   POST /api/bookings/confirm
 * @desc    Confirm booking after payment
 * @access  Private
 */
router.post('/confirm', authenticate, validate(confirmBookingSchema), confirmBookingController);

/**
 * @route   GET /api/bookings
 * @desc    Get specific booking (via query) or user bookings? 
 *          Legacy behavior: req.query.bookingId -> specific booking.
 */
router.get('/', authenticate, validate(getBookingsQuerySchema, 'query'), getBooking);

/**
 * @route   GET /api/bookings/data
 * @desc    Get user bookings list
 * @access  Private
 */
router.get('/data', authenticate, validate(getBookingsQuerySchema, 'query'), getUserBookings);

/**
 * @route   GET /api/bookings/:bookingId
 * @desc    Get booking details
 * @access  Private
 */
router.get('/:bookingId', authenticate, validate(bookingIdParamSchema, 'params'), getBooking);

/**
 * @route   GET /api/bookings/type/counts
 * @desc    Get booking type counts
 * @access  Private
 */
router.get('/type/counts', authenticate, validate(bookingTypeCountsQuerySchema, 'query'), getBookingtypeCountsController);

/**
 * @route   POST /api/bookings/cancel
 * @desc    User cancel booking
 * @access  Private
 */
router.post('/cancel', authenticate, validate(userCancelBookingSchema), UserCancelBookingController);

/**
 * @route   DELETE /api/bookings/:bookingId
 * @desc    Delete upcoming booking
 * @access  Private
 */
router.delete('/:bookingId', authenticate, validate(bookingIdParamSchema, 'params'), UserDeleteUpcomingBookingController);

/**
 * @route   POST /api/bookings/gratuity
 * @desc    Update gratuity for booking
 * @access  Private
 */
router.post('/gratuity', authenticate, validate(updateGratuitySchema), addGratuity);

/**
 * @route   POST /api/bookings/rating
 * @desc    Add rating to booking
 * @access  Private
 */
router.post('/rating', authenticate, validate(addRatingSchema), addRating);

/**
 * @route   GET /api/bookings/gratuity/total
 * @desc    Get total gratuity by category
 * @access  Private
 */
router.get('/gratuity/total', authenticate, getTotalGratuityCategoryWiseController);

module.exports = router;

