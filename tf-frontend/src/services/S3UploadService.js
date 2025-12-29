// s3Service.js (refactored)
// IMPORTANT: Client no longer holds S3 credentials or uploads directly to S3.
// This function proxies file uploads to the backend which performs the S3 upload.
import axiosInstance from './axiosInterceptor';

export const uploadToS3 = async (file, fName = '', bucketFolder = 'flawless') => {
  try {
    const fileName = fName || file?.fileName || `file_${Date.now()}`;

    const formData = new FormData();
    formData.append('file', {
      uri: file.uri || file.uri, // react-native file uri
      name: fileName,
      type: file.type || 'application/octet-stream',
    });
    formData.append('folder', bucketFolder);

    // Backend endpoint should accept multipart form-data and return uploaded file URL
    const response = await axiosInstance.post('/send-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response?.data?.url) {
      return response.data.url;
    }

    // Fallback: return full response if URL not found
    return response.data;
  } catch (error) {
    console.error('Error in uploadToS3 (proxied):', error?.response || error.message || error);
    throw error;
  }
};
