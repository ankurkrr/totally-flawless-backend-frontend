const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validation');
const Joi = require('joi');

// Wishlist Controllers
const { AddWishlistController, GetWishlistController, RemoveWishlistController, ContactSendMainController } = require('../controllers/WishlistController');

// Validators
const addWishlistSchema = Joi.object({
    userId: Joi.string().uuid().required(),
    serviceId: Joi.string().uuid().required()
});

const removeWishlistSchema = Joi.object({
    wishlistId: Joi.string().uuid().required()
});

const contactSchema = Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
    email: Joi.string().email().trim().lowercase().required(),
    message: Joi.string().trim().min(1).max(2000).required()
});

/**
 * @route   POST /api/wishlist
 * @desc    Add item to wishlist
 * @access  Private
 */
router.post('/', authenticate, validate(addWishlistSchema), AddWishlistController);

/**
 * @route   GET /api/wishlist
 * @desc    Get user wishlist
 * @access  Private
 */
router.get('/', authenticate, GetWishlistController);

/**
 * @route   DELETE /api/wishlist/:wishlistId
 * @desc    Remove item from wishlist
 * @access  Private
 */
router.delete('/:wishlistId', authenticate, validate(removeWishlistSchema, 'params'), RemoveWishlistController);

/**
 * @route   POST /api/wishlist/contact
 * @desc    Send contact message
 * @access  Private
 */
router.post('/contact', authenticate, validate(contactSchema), ContactSendMainController);

module.exports = router;

