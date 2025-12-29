const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const pageController = require('../../controllers/admin/pageController');

/**
 * @route   GET /admin/pages
 * @desc    Get page content
 * @access  Public
 */
router.get('/', pageController.getPageController);

/**
 * @route   POST /admin/pages/update
 * @desc    Update page content
 * @access  Private
 */
router.post('/update', authenticate, pageController.updatePageController);

module.exports = router;

