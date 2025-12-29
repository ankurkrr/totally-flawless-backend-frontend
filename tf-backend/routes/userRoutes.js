/**
 * @fileoverview User Routes
 * @description Defines all user-related API endpoints
 * @module routes/userRoutes
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();

// ============================================================================
// MIDDLEWARE IMPORTS
// ============================================================================
const { authenticate } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validation');

// ============================================================================
// CONTROLLER IMPORTS
// ============================================================================
// User Management Controllers
const { updateUserController, updateUserGratuityController } = require('../controllers/updateUserController');
const { getUserDetailsController } = require('../controllers/getUserDetailsController');
const { deleteUserController } = require('../controllers/updateArtistController'); // TODO: Move to userController
const { createSignupController } = require('../controllers/createSignupController');

// Address Management Controllers
const { addAddressesController } = require('../controllers/addAddressesController');
const { updateAddressController } = require('../controllers/updateAddressController');
const { getAddressController } = require('../controllers/getAddressController');
const { getAddressByIdController } = require('../controllers/getAddressByIdController');
const { deleteAddressController } = require('../controllers/deleteAddressController');

// ============================================================================
// VALIDATOR IMPORTS
// ============================================================================
const { updateUserSchema, updateUserGratuitySchema } = require('../validators/userValidators');
const { addAddressSchema, updateAddressSchema, getAddressByIdSchema } = require('../validators/addressValidators');
const { deleteUserSchema } = require('../validators/commonValidators');

// ============================================================================
// FILE UPLOAD CONFIGURATION
// ============================================================================
const { uploads } = require('../connection/s3ServiceImg');

/**
 * @route   GET /api/users/profile
 * @desc    Get user details
 * @access  Private
 */
router.get('/profile', authenticate, getUserDetailsController);

/**
 * @route   POST /api/users/update
 * @desc    Update user profile
 * @access  Private
 */
router.post('/update', authenticate, validate(updateUserSchema), updateUserController);

/**
 * @route   POST /api/users/update-gratuity
 * @desc    Update user gratuity preference
 * @access  Private
 */
router.post('/update-gratuity', authenticate, validate(updateUserGratuitySchema), updateUserGratuityController);

/**
 * @route   POST /api/users/delete
 * @desc    Delete user account (soft delete)
 * @access  Private
 * @param   {Object} req.body.confirm - Confirmation flag (must be true)
 * @param   {string} [req.body.password] - Optional password verification
 * @returns {Object} Success/error response
 */
router.post('/delete', authenticate, validate(deleteUserSchema), deleteUserController);

/**
 * @route   POST /api/users/signup
 * @desc    Complete user signup with image
 * @access  Private
 */
router.post('/signup', authenticate, uploads.any(), createSignupController);

// Address Routes
/**
 * @route   POST /api/users/addresses
 * @desc    Add new address
 * @access  Private
 */
router.post('/addresses', authenticate, validate(addAddressSchema), addAddressesController);

/**
 * @route   GET /api/users/addresses
 * @desc    Get all user addresses
 * @access  Private
 */
router.get('/addresses', authenticate, getAddressController);

/**
 * @route   GET /api/users/addresses/:addressId
 * @desc    Get address by ID
 * @access  Private
 */
router.get('/addresses/:addressId', authenticate, validate(getAddressByIdSchema, 'params'), getAddressByIdController);

/**
 * @route   POST /api/users/addresses/update
 * @desc    Update address
 * @access  Private
 */
router.post('/addresses/update', authenticate, validate(updateAddressSchema), updateAddressController);

/**
 * @route   DELETE /api/users/addresses/:addressId
 * @desc    Delete address
 * @access  Private
 */
router.delete('/addresses/:addressId', authenticate, validate(getAddressByIdSchema, 'params'), deleteAddressController);

module.exports = router;

