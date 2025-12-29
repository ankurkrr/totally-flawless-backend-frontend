const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validation');
const Joi = require('joi');
const { uploads } = require('../connection/s3ServiceImg');

// Gallery Controllers
const { admincreateGalleryController, admindeleteGalleryController, admingetGalleryByUserIdController } = require('../controllers/galleryController');

// Validators
const addGallerySchema = Joi.object({
    userId: Joi.string().uuid().required(),
    imageUrl: Joi.string().uri().optional()
});

const getGallerySchema = Joi.object({
    userId: Joi.string().uuid().required()
});

const deleteGallerySchema = Joi.object({
    id: Joi.string().uuid().required()
});

/**
 * @route   POST /api/gallery
 * @desc    Add gallery image
 * @access  Private
 */
router.post('/', authenticate, uploads.any(), validate(addGallerySchema), admincreateGalleryController);

/**
 * @route   GET /api/gallery/:userId
 * @desc    Get gallery by user ID
 * @access  Private
 */
router.get('/:userId', authenticate, validate(getGallerySchema, 'params'), admingetGalleryByUserIdController);

/**
 * @route   DELETE /api/gallery/:id
 * @desc    Delete gallery image
 * @access  Private
 * @param   {string} req.params.id - Gallery image ID
 * @returns {Object} Success/error response
 */
router.delete('/:id', authenticate, validate(deleteGallerySchema, 'params'), admindeleteGalleryController);

module.exports = router;

