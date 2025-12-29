const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validation');

// Cart Controllers
const { getCart, handleCartAction } = require('../controllers/cartController');
const { assignCartItemToArtistsController } = require('../controllers/getAddressController'); // Keeping legacy location controller for now

// Validators
const { addToCartSchema, assignArtistToCartSchema } = require('../validators/cartValidators');

/**
 * @route   POST /api/cart
 * @desc    Add/Update/Delete item in cart (Action Dispatcher)
 * @access  Private
 */
router.post('/', authenticate, validate(addToCartSchema), handleCartAction);

/**
 * @route   GET /api/cart
 * @desc    Get user cart
 * @access  Private
 */
router.get('/', authenticate, getCart);

/**
 * @route   POST /api/cart/assign-artist
 * @desc    Assign artist to cart items
 * @access  Private
 */
router.post('/assign-artist', authenticate, validate(assignArtistToCartSchema), assignCartItemToArtistsController);

module.exports = router;

