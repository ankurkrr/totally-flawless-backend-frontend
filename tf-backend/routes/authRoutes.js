const express = require('express');
const router = express.Router();
const { createUser } = require('../controllers/userController');
const { getOtpController } = require('../controllers/getOtpController');
const { tokenController } = require('../controllers/tokenController');
const { createArtistController } = require('../controllers/createArtistController');
const { getArtistOtpController } = require('../controllers/getArtistOtpController');
const { IsEmailExistController } = require('../controllers/isEmailExistController');
const { validate } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');
const { createUserSchema, getOtpSchema, verifyOtpSchema, checkEmailSchema } = require('../validators/userValidators');
const { createArtistSchema, getArtistOtpSchema, verifyArtistOtpSchema } = require('../validators/artistValidators');

/**
 * @route   POST /api/auth/create-user
 * @desc    Register a new user
 * @access  Public
 */
router.post('/create-user', authLimiter, validate(createUserSchema), createUser);

/**
 * @route   GET /api/auth/get-otp
 * @desc    Generate and send OTP to user's phone
 * @access  Public
 */
router.get('/get-otp', authLimiter, validate(getOtpSchema, 'query'), getOtpController);

/**
 * @route   POST /api/auth/token
 * @desc    Generate JWT token (alternative auth)
 * @access  Public
 */
router.post('/token', authLimiter, tokenController);

/**
 * @route   POST /api/auth/create-artist
 * @desc    Register a new artist
 * @access  Public
 */
const { createArtist } = require('../controllers/artistController');

/**
 * @route   POST /api/auth/create-artist
 * @desc    Register a new artist
 * @access  Public
 */
router.post('/create-artist', authLimiter, validate(createArtistSchema), createArtist);

/**
 * @route   GET /api/auth/get-artist-otp
 * @desc    Generate and send OTP to artist's phone
 * @access  Public
 */
router.get('/get-artist-otp', authLimiter, validate(getArtistOtpSchema, 'query'), getArtistOtpController);

/**
 * @route   GET /api/auth/check-email
 * @desc    Check if email exists
 * @access  Public
 */
router.get('/check-email', authLimiter, validate(checkEmailSchema, 'query'), IsEmailExistController);

module.exports = router;

