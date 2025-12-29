const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { validate } = require('../../middleware/validation');
const Joi = require('joi');

// Admin Report Controllers
const { getAllBookingItemController, updateArtistPaymentStatusController, getTotalBookingFee } = require('../../controllers/admin/reportController');

// Validators
const updatePaymentStatusSchema = Joi.object({
    artistId: Joi.string().uuid().required(),
    bookingItemId: Joi.string().uuid().required(),
    paymentStatus: Joi.string().valid('pending', 'paid', 'failed').required()
});

/**
 * @route   GET /admin/reports/booking-items
 * @desc    Get all booking items
 * @access  Public (should be private in production)
 */
router.get('/booking-items', getAllBookingItemController);

/**
 * @route   POST /admin/reports/artists/payment
 * @desc    Update artist payment status
 * @access  Public (should be private in production)
 */
router.post('/artists/payment', validate(updatePaymentStatusSchema), updateArtistPaymentStatusController);

/**
 * @route   GET /admin/reports/total-booking-fee
 * @desc    Get total booking fee
 * @access  Private
 */
router.get('/total-booking-fee', authenticate, getTotalBookingFee);

/**
 * @route   GET /admin/reports/total-earning
 * @desc    Get total earnings (placeholder - implement if needed)
 * @access  Private
 */
router.get('/total-earning', authenticate, async (req, res) => {
    // TODO: Implement getTotalEarning controller if needed
    res.status(501).json({
        status: 'error',
        message: 'Total earning endpoint not yet implemented'
    });
});

module.exports = router;

