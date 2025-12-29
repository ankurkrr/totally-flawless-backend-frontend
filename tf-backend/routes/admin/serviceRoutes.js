const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { validate } = require('../../middleware/validation');
const Joi = require('joi');
const { uploads } = require('../../connection/s3ServiceImg');

// Admin Service Controllers
const { admingetAllServiceController, admingetServiceByIdController, admingetServiceByCategoryidController, admincreateOrUpdateServiceController, admincreateOrUpdateSubServiceController, admingetSubServicesByServiceIdController, admindeleteSubServiceController, admindeleteServiceController } = require('../../controllers/admin/serviceController');

// Validators
const createOrUpdateServiceSchema = Joi.object({
    id: Joi.string().uuid().optional(),
    name: Joi.string().trim().min(1).max(200).required(),
    categoryId: Joi.string().uuid().required(),
    description: Joi.string().trim().max(2000).optional(),
    imgUrl: Joi.string().uri().optional()
});

const createOrUpdateSubServiceSchema = Joi.object({
    id: Joi.string().uuid().optional(),
    serviceId: Joi.string().uuid().required(),
    name: Joi.string().trim().min(1).max(200).required(),
    price: Joi.number().min(0).precision(2).required(),
    description: Joi.string().trim().max(2000).optional(),
    imgUrl: Joi.string().uri().optional()
});

/**
 * @route   GET /admin/services
 * @desc    Get all services
 * @access  Private
 */
router.get('/', authenticate, admingetAllServiceController);

/**
 * @route   GET /admin/services/:id
 * @desc    Get service by ID
 * @access  Private
 */
router.get('/:id', authenticate, admingetServiceByIdController);

/**
 * @route   GET /admin/services/category/:categoryId
 * @desc    Get services by category ID
 * @access  Private
 */
router.get('/category/:categoryId', authenticate, admingetServiceByCategoryidController);

/**
 * @route   POST /admin/services
 * @desc    Create or update service
 * @access  Private
 */
router.post('/', authenticate, uploads.single('imgUrl'), validate(createOrUpdateServiceSchema), admincreateOrUpdateServiceController);

/**
 * @route   DELETE /admin/services/:serviceId
 * @desc    Delete service
 * @access  Private
 */
router.delete('/:serviceId', authenticate, admindeleteServiceController);

/**
 * @route   GET /admin/services/:serviceId/subservices
 * @desc    Get sub-services by service ID
 * @access  Private
 */
router.get('/:serviceId/subservices', authenticate, admingetSubServicesByServiceIdController);

/**
 * @route   POST /admin/services/subservices
 * @desc    Create or update sub-service
 * @access  Private
 */
router.post('/subservices', authenticate, uploads.single('imgUrl'), validate(createOrUpdateSubServiceSchema), admincreateOrUpdateSubServiceController);

/**
 * @route   DELETE /admin/services/subservices/:subServiceId
 * @desc    Delete sub-service
 * @access  Private
 */
router.delete('/subservices/:subServiceId', authenticate, admindeleteSubServiceController);

module.exports = router;

