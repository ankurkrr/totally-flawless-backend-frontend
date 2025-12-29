/**
 * Upload Service
 * 
 * Handles temporary credential generation and upload completion
 */

const db = require('../connection/knexdatabase');
const { v4: uuidv4 } = require('uuid');
const stsService = require('./stsService');
const { S3Client, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const KeyProvider = require('../utils/keyProvider');

class UploadService {
    /**
     * Generate temporary credentials for S3 upload
     * @param {string} userId - User ID
     * @param {string} purpose - Upload purpose (PROFILE_IMAGE, BOOKING_MEDIA)
     * @returns {Promise<Object>} Temporary credentials
     */
    async generateCredentials(userId, purpose) {
        // Validate purpose
        if (!['PROFILE_IMAGE', 'BOOKING_MEDIA'].includes(purpose)) {
            throw new Error('Invalid purpose. Must be PROFILE_IMAGE or BOOKING_MEDIA');
        }

        // Generate temporary credentials
        const credentials = await stsService.getTemporaryCredentials(userId, purpose);

        return credentials;
    }

    /**
     * Complete upload and store metadata
     * @param {string} userId - User ID
     * @param {Object} uploadData - Upload data
     * @returns {Promise<Object>} Upload metadata with URL
     */
    async completeUpload(userId, uploadData) {
        const { s3Key, purpose, fileName, fileSize, contentType } = uploadData;

        // Verify S3 key belongs to user
        if (!stsService.verifyKeyOwnership(s3Key, userId)) {
            throw new Error('S3 key does not belong to this user');
        }

        // Verify purpose matches path
        const expectedPrefix = stsService.generatePathPrefix(userId, purpose);
        if (!s3Key.startsWith(expectedPrefix)) {
            throw new Error('S3 key does not match the specified purpose');
        }

        // Get AWS credentials for S3 operations
        const awsCredentials = await KeyProvider.getAWSCredentials();
        const bucketName = process.env.S3_BUCKET_NAME || 'flawless-uploads';
        const region = process.env.AWS_REGION || 'us-east-1';

        // Verify file exists in S3
        const s3Client = new S3Client({
            region: region,
            credentials: {
                accessKeyId: awsCredentials.accessKeyId,
                secretAccessKey: awsCredentials.secretAccessKey
            }
        });

        try {
            // Use HeadObject to check if file exists without downloading
            await s3Client.send(new HeadObjectCommand({
                Bucket: bucketName,
                Key: s3Key
            }));
        } catch (error) {
            if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
                throw new Error('File not found in S3. Upload may have failed.');
            }
            throw new Error(`Failed to verify upload: ${error.message}`);
        }

        // Generate public URL or signed URL
        // For profile images, use public URL if bucket is public
        // For booking media, use signed URL for security
        let url;
        if (purpose === 'PROFILE_IMAGE') {
            // Public URL (if bucket/object is public)
            url = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;
        } else {
            // Signed URL (valid for 1 year)
            const command = new GetObjectCommand({
                Bucket: bucketName,
                Key: s3Key
            });
            url = await getSignedUrl(s3Client, command, { expiresIn: 31536000 }); // 1 year
        }

        // Store upload metadata in database
        const uploadId = uuidv4();
        await db('uploads').insert({
            id: uploadId,
            user_id: userId,
            s3_key: s3Key,
            s3_bucket: bucketName,
            purpose: purpose,
            file_name: fileName || null,
            file_size: fileSize || null,
            content_type: contentType || null,
            url: url,
            status: 'completed'
        });

        return {
            id: uploadId,
            s3Key: s3Key,
            url: url,
            purpose: purpose,
            status: 'completed',
            createdAt: new Date().toISOString()
        };
    }

    /**
     * Get user's uploads
     * @param {string} userId - User ID
     * @param {string} purpose - Optional filter by purpose
     * @returns {Promise<Array>} List of uploads
     */
    async getUserUploads(userId, purpose = null) {
        let query = db('uploads')
            .where('user_id', userId)
            .where('status', 'completed')
            .orderBy('created_at', 'desc');

        if (purpose) {
            query = query.where('purpose', purpose);
        }

        return await query;
    }

    /**
     * Delete upload record (does not delete from S3)
     * @param {string} uploadId - Upload ID
     * @param {string} userId - User ID (for verification)
     * @returns {Promise<boolean>} Success status
     */
    async deleteUpload(uploadId, userId) {
        const upload = await db('uploads')
            .where({ id: uploadId, user_id: userId })
            .first();

        if (!upload) {
            throw new Error('Upload not found or does not belong to user');
        }

        await db('uploads')
            .where({ id: uploadId })
            .update({ status: 'failed' }); // Mark as failed/deleted

        return true;
    }
}

module.exports = new UploadService();

