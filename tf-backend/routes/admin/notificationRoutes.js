const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { validate } = require('../../middleware/validation');
const Joi = require('joi');

// Admin Notification Controllers
const { admincreateNotificationController, admingetNotificationsController } = require('../../controllers/admin/notificationController');

// Validators
const createNotificationSchema = Joi.object({
    title: Joi.string().trim().min(1).max(200).required(),
    body: Joi.string().trim().min(1).max(1000).required(),
    userId: Joi.string().uuid().optional(),
    artistId: Joi.string().uuid().optional(),
    type: Joi.string().valid('info', 'warning', 'error', 'success').optional()
});

/**
 * @route   POST /admin/notifications
 * @desc    Create notification
 * @access  Private
 */
router.post('/', authenticate, validate(createNotificationSchema), admincreateNotificationController);

/**
 * @route   GET /admin/notifications
 * @desc    Get all notifications
 * @access  Private
 */
router.get('/', authenticate, admingetNotificationsController);

module.exports = router;

