/**
 * AWS STS Service for Temporary Credentials
 * 
 * Uses AWS STS AssumeRole to generate temporary credentials scoped to user-specific paths
 * This provides secure, time-limited access to S3 without exposing permanent credentials
 */

require('dotenv').config();
const AWS = require('aws-sdk');
const KeyProvider = require('../utils/keyProvider');

class STSService {
    constructor() {
        this.stsClient = null;
        this.roleArn = process.env.AWS_STS_ROLE_ARN;
        this.bucketName = process.env.S3_BUCKET_NAME || 'flawless-uploads';
        this.region = process.env.AWS_REGION || 'us-east-1';
        this.sessionDuration = 900; // 15 minutes in seconds
    }

    /**
     * Initialize STS client with credentials from KeyProvider
     */
    async initializeSTSClient() {
        if (this.stsClient) {
            return this.stsClient;
        }

        try {
            // Get AWS credentials from KeyProvider
            const credentials = await KeyProvider.getAWSCredentials();
            
            this.stsClient = new AWS.STS({
                region: this.region,
                credentials: {
                    accessKeyId: credentials.accessKeyId,
                    secretAccessKey: credentials.secretAccessKey
                }
            });
        } catch (error) {
            // Fallback to environment variables during migration
            const fallbackAccessKey = process.env.AWS_ACCESS_KEY_ID;
            const fallbackSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
            
            if (!fallbackAccessKey || !fallbackSecretKey) {
                throw new Error('AWS credentials not found in Key Management System or environment variables');
            }

            this.stsClient = new AWS.STS({
                region: this.region,
                credentials: {
                    accessKeyId: fallbackAccessKey,
                    secretAccessKey: fallbackSecretKey
                }
            });
        }

        return this.stsClient;
    }

    /**
     * Generate temporary credentials for user-scoped S3 uploads
     * @param {string} userId - User ID for scoping the path
     * @param {string} purpose - Upload purpose (PROFILE_IMAGE, BOOKING_MEDIA)
     * @returns {Promise<Object>} Temporary credentials with S3 configuration
     */
    async getTemporaryCredentials(userId, purpose) {
        if (!this.roleArn) {
            // If no role ARN configured, use direct credentials with policy
            // This is less secure but works without IAM role setup
            return this.getDirectTemporaryCredentials(userId, purpose);
        }

        // Use AssumeRole for better security (requires IAM role setup)
        return this.getAssumeRoleCredentials(userId, purpose);
    }

    /**
     * Get temporary credentials using AssumeRole (recommended)
     * Requires AWS_STS_ROLE_ARN to be configured
     */
    async getAssumeRoleCredentials(userId, purpose) {
        const sts = await this.initializeSTSClient();
        
        // Generate user-scoped path prefix
        const pathPrefix = this.generatePathPrefix(userId, purpose);
        
        // Policy that restricts access to user's path only
        const policy = {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Action: [
                        's3:PutObject',
                        's3:PutObjectAcl'
                    ],
                    Resource: `arn:aws:s3:::${this.bucketName}/${pathPrefix}*`,
                    Condition: {
                        StringEquals: {
                            's3:x-amz-server-side-encryption': 'AES256'
                        }
                    }
                },
                {
                    Effect: 'Allow',
                    Action: [
                        's3:GetObject'
                    ],
                    Resource: `arn:aws:s3:::${this.bucketName}/${pathPrefix}*`
                },
                {
                    Effect: 'Allow',
                    Action: [
                        's3:ListBucket'
                    ],
                    Resource: `arn:aws:s3:::${this.bucketName}`,
                    Condition: {
                        StringLike: {
                            's3:prefix': `${pathPrefix}*`
                        }
                    }
                }
            ]
        };

        const params = {
            RoleArn: this.roleArn,
            RoleSessionName: `upload-${userId}-${Date.now()}`,
            DurationSeconds: this.sessionDuration,
            Policy: JSON.stringify(policy)
        };

        try {
            const result = await sts.assumeRole(params).promise();
            
            const credentials = result.Credentials;
            const expiresAt = new Date(credentials.Expiration);

            return {
                bucket: this.bucketName,
                region: this.region,
                prefix: pathPrefix,
                accessKeyId: credentials.AccessKeyId,
                secretAccessKey: credentials.SecretAccessKey,
                sessionToken: credentials.SessionToken,
                expiresAt: expiresAt.toISOString()
            };
        } catch (error) {
            console.error('STS AssumeRole error:', error);
            throw new Error(`Failed to generate temporary credentials: ${error.message}`);
        }
    }

    /**
     * Get temporary credentials using GetSessionToken (fallback)
     * Used when AssumeRole is not configured
     * Note: GetSessionToken does NOT support Policy parameter, so we can't restrict access
     * For production, use AssumeRole with AWS_STS_ROLE_ARN configured
     */
    async getDirectTemporaryCredentials(userId, purpose) {
        const sts = await this.initializeSTSClient();
        
        // Generate user-scoped path prefix
        const pathPrefix = this.generatePathPrefix(userId, purpose);
        
        // Note: GetSessionToken doesn't support Policy parameter
        // The credentials will have the same permissions as the AWS credentials used
        // For scoped access, use AssumeRole with AWS_STS_ROLE_ARN configured
        const params = {
            DurationSeconds: this.sessionDuration
            // Policy parameter is NOT supported by getSessionToken
        };

        try {
            const result = await sts.getSessionToken(params).promise();
            
            const credentials = result.Credentials;
            const expiresAt = new Date(credentials.Expiration);

            console.warn('⚠️  Using GetSessionToken without policy restrictions. For production, configure AWS_STS_ROLE_ARN to use AssumeRole with scoped policies.');

            return {
                bucket: this.bucketName,
                region: this.region,
                prefix: pathPrefix,
                accessKeyId: credentials.AccessKeyId,
                secretAccessKey: credentials.SecretAccessKey,
                sessionToken: credentials.SessionToken,
                expiresAt: expiresAt.toISOString()
            };
        } catch (error) {
            console.error('STS GetSessionToken error:', error);
            throw new Error(`Failed to generate temporary credentials: ${error.message}`);
        }
    }

    /**
     * Generate user-scoped path prefix
     * @param {string} userId - User ID
     * @param {string} purpose - Upload purpose
     * @returns {string} Path prefix (e.g., "users/{userId}/profile/" or "users/{userId}/bookings/")
     */
    generatePathPrefix(userId, purpose) {
        const sanitizedUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
        
        switch (purpose) {
            case 'PROFILE_IMAGE':
                return `users/${sanitizedUserId}/profile/`;
            case 'BOOKING_MEDIA':
                return `users/${sanitizedUserId}/bookings/`;
            default:
                return `users/${sanitizedUserId}/`;
        }
    }

    /**
     * Verify that an S3 key belongs to a specific user
     * @param {string} s3Key - S3 object key
     * @param {string} userId - User ID to verify against
     * @returns {boolean} True if key belongs to user
     */
    verifyKeyOwnership(s3Key, userId) {
        const sanitizedUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
        const expectedPrefixes = [
            `users/${sanitizedUserId}/profile/`,
            `users/${sanitizedUserId}/bookings/`,
            `users/${sanitizedUserId}/`
        ];
        
        return expectedPrefixes.some(prefix => s3Key.startsWith(prefix));
    }
}

module.exports = new STSService();

