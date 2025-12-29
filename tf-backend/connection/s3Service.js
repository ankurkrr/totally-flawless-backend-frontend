require('dotenv').config();
const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { v4: uuidv4 } = require('uuid');

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials are not set in environment variables');
}

class S3Service {
    constructor() {
        this.client = new S3Client({
            region: process.env.AWS_REGION || 'us-east-2',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
        });
    }

    async uploadFile(file) {
        if (!process.env.S3_BUCKET_NAME) {
            throw new Error('S3_BUCKET_NAME is not set in environment variables');
        }
        const bucketName = process.env.S3_BUCKET_NAME;
        const params = {
            Bucket: bucketName,
            Key: `${uuidv4()}-${file.originalname}`,
            Body: file.buffer,
            ContentType: file.mimetype,
        };

        const upload = new Upload({
            client: this.client,
            params: params,
        });

        const data = await upload.done();
        return data.Location;
    }

}

module.exports = S3Service;
