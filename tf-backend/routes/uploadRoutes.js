/**
 * Upload Routes
 * 
 * Handles temporary credential generation and upload completion
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validation');
const { uploadLimiter } = require('../middleware/rateLimiter');
const {
    requestCredentials,
    completeUpload,
    getUserUploads
} = require('../controllers/uploadController');
const {
    requestCredentialsSchema,
    completeUploadSchema
} = require('../validators/uploadValidators');

/**
 * @route   POST /api/uploads/credentials
 * @desc    Request temporary AWS credentials for S3 upload
 * @access  Private (JWT required)
 * @body    { purpose: "PROFILE_IMAGE" | "BOOKING_MEDIA" }
 */
router.post(
    '/credentials',
    uploadLimiter,
    authenticate,
    validate(requestCredentialsSchema),
    requestCredentials
);

/**
 * @route   POST /api/uploads/complete
 * @desc    Complete upload and store metadata
 * @access  Private (JWT required)
 * @body    { s3Key: string, purpose: string, fileName?: string, fileSize?: number, contentType?: string }
 */
router.post(
    '/complete',
    uploadLimiter,
    authenticate,
    validate(completeUploadSchema),
    completeUpload
);

/**
 * @route   GET /api/uploads
 * @desc    Get user's uploads
 * @access  Private (JWT required)
 * @query   purpose?: "PROFILE_IMAGE" | "BOOKING_MEDIA"
 */
router.get(
    '/',
    authenticate,
    getUserUploads
);

module.exports = router;

