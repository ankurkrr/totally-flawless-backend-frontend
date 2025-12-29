const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validation');
const Joi = require('joi');

// Device Controllers
const { DivicesController, DivicesCallController, DivicesGetCallController } = require('../controllers/DeviceController');

// Validators
const manageDeviceSchema = Joi.object({
    userId: Joi.string().uuid().required(),
    deviceToken: Joi.string().trim().min(1).required(),
    deviceType: Joi.string().valid('ios', 'android').required()
});

const createCallSchema = Joi.object({
    userId: Joi.string().uuid().required(),
    artistId: Joi.string().uuid().required(),
    bookingId: Joi.string().uuid().optional()
});

const getCallQuerySchema = Joi.object({
    callId: Joi.string().uuid().optional(),
    userId: Joi.string().uuid().optional(),
    artistId: Joi.string().uuid().optional()
}).or('callId', 'userId', 'artistId')
  .messages({
      'object.missing': 'At least one of callId, userId, or artistId must be provided'
  });

/**
 * @route   POST /api/devices
 * @desc    Manage device tokens
 * @access  Private
 */
router.post('/', authenticate, validate(manageDeviceSchema), DivicesController);

/**
 * @route   POST /api/devices/call
 * @desc    Create call
 * @access  Private
 */
router.post('/call', authenticate, validate(createCallSchema), DivicesCallController);

/**
 * @route   GET /api/devices/call
 * @desc    Get call information
 * @access  Private
 * @param   {string} [req.query.callId] - Call ID
 * @param   {string} [req.query.userId] - User ID
 * @param   {string} [req.query.artistId] - Artist ID
 * @returns {Object} Call information
 */
router.get('/call', authenticate, validate(getCallQuerySchema, 'query'), DivicesGetCallController);

module.exports = router;

