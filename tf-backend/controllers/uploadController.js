/**
 * Upload Controller
 * 
 * Handles HTTP requests for upload credential generation and completion
 */

const uploadService = require('../services/uploadService');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * Request temporary credentials for S3 upload
 * POST /api/uploads/credentials
 */
const requestCredentials = asyncHandler(async (req, res) => {
    const { purpose } = req.body;
    const userId = req.user.id || req.user.userId;

    if (!userId) {
        return res.status(401).json({
            status: 0,
            message: 'User not authenticated'
        });
    }

    try {
        const credentials = await uploadService.generateCredentials(userId, purpose);

        res.status(200).json({
            status: 1,
            message: 'Temporary credentials generated successfully',
            data: credentials
        });
    } catch (error) {
        console.error('Error generating credentials:', error);
        res.status(500).json({
            status: 0,
            message: error.message || 'Failed to generate temporary credentials'
        });
    }
});

/**
 * Complete upload and store metadata
 * POST /api/uploads/complete
 */
const completeUpload = asyncHandler(async (req, res) => {
    const { s3Key, purpose, fileName, fileSize, contentType } = req.body;
    const userId = req.user.id || req.user.userId;

    if (!userId) {
        return res.status(401).json({
            status: 0,
            message: 'User not authenticated'
        });
    }

    try {
        const result = await uploadService.completeUpload(userId, {
            s3Key,
            purpose,
            fileName,
            fileSize,
            contentType
        });

        res.status(200).json({
            status: 1,
            message: 'Upload completed successfully',
            data: result
        });
    } catch (error) {
        console.error('Error completing upload:', error);
        
        const statusCode = error.message.includes('not belong') || 
                          error.message.includes('not found') ? 403 : 500;

        res.status(statusCode).json({
            status: 0,
            message: error.message || 'Failed to complete upload'
        });
    }
});

/**
 * Get user's uploads
 * GET /api/uploads
 */
const getUserUploads = asyncHandler(async (req, res) => {
    const userId = req.user.id || req.user.userId;
    const { purpose } = req.query;

    if (!userId) {
        return res.status(401).json({
            status: 0,
            message: 'User not authenticated'
        });
    }

    try {
        const uploads = await uploadService.getUserUploads(userId, purpose || null);

        res.status(200).json({
            status: 1,
            message: 'Uploads retrieved successfully',
            data: uploads
        });
    } catch (error) {
        console.error('Error retrieving uploads:', error);
        res.status(500).json({
            status: 0,
            message: error.message || 'Failed to retrieve uploads'
        });
    }
});

module.exports = {
    requestCredentials,
    completeUpload,
    getUserUploads
};

