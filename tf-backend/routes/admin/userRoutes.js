const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { validate } = require('../../middleware/validation');
const Joi = require('joi');
const { uploads } = require('../../connection/s3ServiceImg');

// Admin User Controllers
const { admingetAllUsersController, admingetUserByIdController, adminaddUserController, adminupdateUserController, admindeleteUserController, admingetServiceStaticController } = require('../../controllers/admin/userController');

// Validators
const addUserSchema = Joi.object({
    firstName: Joi.string().trim().min(1).max(100).required(),
    lastName: Joi.string().trim().min(1).max(100).required(),
    email: Joi.string().email().trim().lowercase().optional(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
    address: Joi.string().trim().max(500).optional(),
    countryCode: Joi.string().trim().max(10).optional()
});

const updateUserSchema = Joi.object({
    firstName: Joi.string().trim().min(1).max(100).optional(),
    lastName: Joi.string().trim().min(1).max(100).optional(),
    email: Joi.string().email().trim().lowercase().optional(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional(),
    address: Joi.string().trim().max(500).optional(),
    countryCode: Joi.string().trim().max(10).optional()
}).min(1);

/**
 * @route   GET /admin/users
 * @desc    Get all users
 * @access  Private
 */
router.get('/', authenticate, admingetAllUsersController);

/**
 * @route   GET /admin/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', authenticate, admingetUserByIdController);

/**
 * @route   POST /admin/users
 * @desc    Add new user
 * @access  Private
 */
router.post('/', authenticate, uploads.single('profileImage'), validate(addUserSchema), adminaddUserController);

/**
 * @route   PUT /admin/users/:id
 * @desc    Update user
 * @access  Private
 */
router.put('/:id', authenticate, uploads.single('profileImage'), validate(updateUserSchema), adminupdateUserController);

/**
 * @route   DELETE /admin/users/:id
 * @desc    Delete user
 * @access  Private
 */
router.delete('/:id', authenticate, admindeleteUserController);

/**
 * @route   GET /admin/users/services/static
 * @desc    Get service statistics
 * @access  Private
 */
router.get('/services/static', authenticate, admingetServiceStaticController);

module.exports = router;

