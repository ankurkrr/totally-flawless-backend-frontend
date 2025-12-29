const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');

// Admin Dashboard Controllers
const { admingetCountController } = require('../../controllers/admin/dashboardController');

/**
 * @route   GET /admin/dashboard/counts
 * @desc    Get dashboard counts
 * @access  Private
 */
router.get('/counts', authenticate, admingetCountController);

module.exports = router;

