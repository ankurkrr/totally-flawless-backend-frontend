require('dotenv').config();
const multer = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials are not set in environment variables');
}

// AWS S3 Configuration
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

if (!process.env.S3_BUCKET_NAME) {
    throw new Error('S3_BUCKET_NAME is not set in environment variables');
}
const bucketName = process.env.S3_BUCKET_NAME;

// Multer configuration
const storage = multer.memoryStorage();

const uploads = multer({
    storage: storage,
    limits: { fileSize: 250 * 1024 * 1024 },
});

// Upload file to S3
async function uploadFileToS3(file) {
    const fileKey = `${Date.now()}_${file.originalname}`;
    const params = {
        Bucket: bucketName,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
    };
    await s3Client.send(new PutObjectCommand(params));
    return `https://${bucketName}.s3.us-east-2.amazonaws.com/${fileKey}`;
}

// Delete file from S3
async function deleteFileFromS3(fileUrl) {
    try {
        const fileKey = fileUrl.split('/').pop(); // Extract only the file name from URL

        const params = {
            Bucket: bucketName,
            Key: fileKey,
        };

        await s3Client.send(new DeleteObjectCommand(params));
        console.log(`File deleted successfully: ${fileKey}`);
    } catch (error) {
        console.error("Error deleting file from S3:", error);
    }
}


module.exports = { uploads, uploadFileToS3, deleteFileFromS3 };
