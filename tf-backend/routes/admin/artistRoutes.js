const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { validate } = require('../../middleware/validation');
const Joi = require('joi');
const { uploads } = require('../../connection/s3ServiceImg');

// Admin Artist Controllers
const { getArtistsController, addArtistsController, adminupdateArtistController, adminaddArtistImagesController, admindeleteArtistImageController, admindeleteArtistController, admingetArtistByIdArtistController, adminapproveArtistController } = require('../../controllers/admin/artistController');

// Validators
const addArtistSchema = Joi.object({
    firstName: Joi.string().trim().min(1).max(100).optional(),
    lastName: Joi.string().trim().min(1).max(100).optional(),
    email: Joi.string().email().trim().lowercase().optional(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
    address: Joi.string().trim().max(500).optional(),
    geocode: Joi.string().trim().max(200).optional(),
    city: Joi.string().trim().max(100).optional(),
    state: Joi.string().trim().max(100).optional(),
    businessType: Joi.number().integer().optional(),
    videoUrl: Joi.string().uri().optional(),
    countryCode: Joi.string().trim().max(10).optional()
});

const updateArtistSchema = Joi.object({
    firstName: Joi.string().trim().min(1).max(100).optional(),
    lastName: Joi.string().trim().min(1).max(100).optional(),
    email: Joi.string().email().trim().lowercase().optional(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional(),
    address: Joi.string().trim().max(500).optional(),
    geocode: Joi.string().trim().max(200).optional(),
    city: Joi.string().trim().max(100).optional(),
    state: Joi.string().trim().max(100).optional(),
    businessType: Joi.number().integer().optional(),
    videoUrl: Joi.string().uri().optional(),
    countryCode: Joi.string().trim().max(10).optional()
}).min(1);

const approveArtistSchema = Joi.object({
    artistId: Joi.string().uuid().required(),
    isApproved: Joi.boolean().required()
});

/**
 * @route   GET /admin/artists
 * @desc    Get all artists
 * @access  Private
 */
router.get('/', authenticate, getArtistsController);

/**
 * @route   GET /admin/artists/:id
 * @desc    Get artist by ID
 * @access  Private
 */
router.get('/:id', authenticate, admingetArtistByIdArtistController);

/**
 * @route   POST /admin/artists
 * @desc    Add new artist
 * @access  Private
 */
router.post('/', authenticate, uploads.any(), validate(addArtistSchema), addArtistsController);

/**
 * @route   PUT /admin/artists/:id
 * @desc    Update artist
 * @access  Private
 */
router.put('/:id', authenticate, uploads.single('profileImage'), validate(updateArtistSchema), adminupdateArtistController);

/**
 * @route   DELETE /admin/artists/:id
 * @desc    Delete artist
 * @access  Private
 */
router.delete('/:id', authenticate, admindeleteArtistController);

/**
 * @route   POST /admin/artists/approve
 * @desc    Approve/Disapprove artist
 * @access  Private
 */
router.post('/approve', authenticate, validate(approveArtistSchema), adminapproveArtistController);

/**
 * @route   POST /admin/artists/:id/images
 * @desc    Add artist images
 * @access  Private
 */
router.post('/:id/images', authenticate, uploads.any(), adminaddArtistImagesController);

/**
 * @route   DELETE /admin/artists/images/:id
 * @desc    Delete artist image
 * @access  Private
 */
router.delete('/images/:id', authenticate, admindeleteArtistImageController);

module.exports = router;

