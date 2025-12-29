const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { validate } = require('../../middleware/validation');
const Joi = require('joi');

// Admin Auth Controllers
const { AuthController, AdminUpdatePasswordController, getProfileController, updateProfileController, getProfileByMobile, forgotPassword } = require('../../controllers/admin/authController');

// Validators
const loginSchema = Joi.object({
    email: Joi.string().email().trim().lowercase().required(),
    password: Joi.string().min(6).required()
});

const updatePasswordSchema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
});

const updateProfileSchema = Joi.object({
    name: Joi.string().trim().min(1).max(100).optional(),
    email: Joi.string().email().trim().lowercase().optional(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional()
}).min(1);

const getProfileByMobileSchema = Joi.object({
    mobile: Joi.string().pattern(/^[0-9]{10,15}$/).required()
});

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().trim().lowercase().required()
});

/**
 * @route   POST /admin/auth/login
 * @desc    Admin login
 * @access  Public
 */
router.post('/login', validate(loginSchema), AuthController);

/**
 * @route   GET /admin/auth/profile
 * @desc    Get admin profile
 * @access  Private
 */
router.get('/profile', authenticate, getProfileController);

/**
 * @route   PUT /admin/auth/profile/:id
 * @desc    Update admin profile
 * @access  Private
 */
router.put('/profile/:id', authenticate, validate(updateProfileSchema), updateProfileController);

/**
 * @route   POST /admin/auth/update-password
 * @desc    Update admin password
 * @access  Private
 */
router.post('/update-password', authenticate, validate(updatePasswordSchema), AdminUpdatePasswordController);

/**
 * @route   POST /admin/auth/profile-by-mobile
 * @desc    Get profile by mobile
 * @access  Public
 */
router.post('/profile-by-mobile', validate(getProfileByMobileSchema), getProfileByMobile);

/**
 * @route   POST /admin/auth/forgot-password
 * @desc    Forgot password
 * @access  Public
 */
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);

module.exports = router;

