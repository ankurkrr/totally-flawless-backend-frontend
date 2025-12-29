const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validation');

// Artist Controllers
const { updateArtistController, updateArtistVideoController } = require('../controllers/updateArtistController');
const { createArtistLocationController, getArtistLocationController } = require('../controllers/createArtistController');
const { getArtistDetailsController, GetArtistBookingsController, artistChangeBookingStatusController, GetCurrentBookingsForArtistController, ArtistApproveController, ArtistAvailableController } = require('../controllers/getArtistDetailsController');
const { artistBookingStatusController, deleteBookingRequestController, assignBookingToArtistController } = require('../controllers/getAddressController');
const { CancelAndCompleteBookingController } = require('../controllers/createBookingsController');

// Validators
const { updateArtistSchema, artistLocationSchema, getArtistBookingsQuerySchema, artistLocationIdParamSchema, artistIdQuerySchema, updateArtistVideoSchema, artistApproveSchema, artistAvailableSchema } = require('../validators/artistValidators');
const { artistBookingStatusSchema, assignBookingSchema, updateBookingStatusSchema } = require('../validators/bookingValidators');
const { uploads } = require('../connection/s3ServiceImg');

/**
 * @route   GET /api/artists/profile
 * @desc    Get artist details
 * @access  Private
 */
router.get('/profile', authenticate, getArtistDetailsController);

/**
 * @route   POST /api/artists/update
 * @desc    Update artist profile
 * @access  Private
 */
router.post('/update', authenticate, validate(updateArtistSchema), updateArtistController);

/**
 * @route   POST /api/artists/update-video
 * @desc    Update artist video URL
 * @access  Private
 */
router.post('/update-video', authenticate, validate(updateArtistVideoSchema), updateArtistVideoController);

/**
 * @route   POST /api/artists/location
 * @desc    Update artist location
 * @access  Private
 */
router.post('/location', authenticate, validate(artistLocationSchema), createArtistLocationController);

/**
 * @route   GET /api/artists/location/:id
 * @desc    Get artist location
 * @access  Private
 */
router.get('/location/:id', authenticate, validate(artistLocationIdParamSchema, 'params'), getArtistLocationController);

/**
 * @route   GET /api/artists/bookings
 * @desc    Get artist bookings
 * @access  Private
 */
router.get('/bookings', authenticate, validate(getArtistBookingsQuerySchema, 'query'), GetArtistBookingsController);

/**
 * @route   GET /api/artists/bookings/current
 * @desc    Get current bookings for artist
 * @access  Private
 */
router.get('/bookings/current', authenticate, validate(artistIdQuerySchema, 'query'), GetCurrentBookingsForArtistController);

/**
 * @route   POST /api/artists/bookings/status
 * @desc    Change booking status (cancel/complete)
 * @access  Private
 */
router.post('/bookings/status', authenticate, validate(updateBookingStatusSchema), CancelAndCompleteBookingController);

/**
 * @route   POST /api/artists/bookings/change-status
 * @desc    Artist changes booking status
 * @access  Private
 */
router.post('/bookings/change-status', authenticate, validate(artistBookingStatusSchema), artistChangeBookingStatusController);

/**
 * @route   POST /api/artists/approve
 * @desc    Approve artist (self-approval)
 * @access  Private
 */
router.post('/approve', authenticate, validate(artistApproveSchema), ArtistApproveController);

/**
 * @route   POST /api/artists/available
 * @desc    Set artist availability
 * @access  Private
 */
router.post('/available', authenticate, validate(artistAvailableSchema), ArtistAvailableController);

/**
 * @route   POST /api/artists/booking-request/respond
 * @desc    Accept/decline booking request
 * @access  Private
 */
router.post('/booking-request/respond', authenticate, validate(artistBookingStatusSchema), artistBookingStatusController);

/**
 * @route   DELETE /api/artists/booking-request/:requestId
 * @desc    Delete booking request
 * @access  Private
 */
router.delete('/booking-request/:requestId', authenticate, deleteBookingRequestController);

/**
 * @route   POST /api/artists/assign-booking
 * @desc    Assign booking to artist
 * @access  Private
 */
router.post('/assign-booking', authenticate, validate(assignBookingSchema), assignBookingToArtistController);

module.exports = router;

