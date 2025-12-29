const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation');

// Catalog Controllers
const { getCategoriesWithServicesController } = require('../controllers/getCategoriesWithServicesController');
const { getPricesForServiceController } = require('../controllers/getPricesForServiceController');
const { getSubCategoriesController } = require('../controllers/getSubCategoriesController');

// Validators
const { getPricesQuerySchema, getSubcategoriesQuerySchema, getCategoriesQuerySchema } = require('../validators/catalogValidators');

/**
 * @route   GET /api/catalog/categories
 * @desc    Get all categories with services
 * @access  Public
 */
router.get('/categories', validate(getCategoriesQuerySchema, 'query'), getCategoriesWithServicesController);

/**
 * @route   GET /api/catalog/prices
 * @desc    Get prices for services
 * @access  Public
 */
router.get('/prices', validate(getPricesQuerySchema, 'query'), getPricesForServiceController);

/**
 * @route   GET /api/catalog/subcategories
 * @desc    Get subcategories by service ID
 * @access  Public
 */
router.get('/subcategories', validate(getSubcategoriesQuerySchema, 'query'), getSubCategoriesController);

module.exports = router;

