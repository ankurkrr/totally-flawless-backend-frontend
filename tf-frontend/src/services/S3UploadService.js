// GCS Upload Service (refactored from S3)
// IMPORTANT: Client no longer holds cloud credentials or uploads directly.
// This function proxies file uploads to the backend which performs the GCS upload.
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL_UPLOAD } from '../store/url';
import { asynchEnums } from '../constants/enums';

export const uploadToS3 = async (file, fName = '', bucketFolder = 'uploads') => {
  try {
    // Get file extension from original filename or URI
    const originalName = file?.fileName || file?.name || '';
    const uriParts = (file?.uri || '').split('.');
    const extension = originalName.includes('.')
      ? originalName.split('.').pop()
      : (uriParts.length > 1 ? uriParts.pop() : 'jpg');

    // Create filename with proper extension
    const fileName = fName
      ? (fName.includes('.') ? fName : `${fName}.${extension}`)
      : (originalName || `file_${Date.now()}.${extension}`);

    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: fileName,
      type: file.type || `image/${extension}`,
    });
    formData.append('folder', bucketFolder);

    // Get auth token
    const token = await AsyncStorage.getItem(asynchEnums.ACCESS_TOKEN);

    console.log('[Upload] Uploading to:', API_URL_UPLOAD);
    console.log('[Upload] File:', { fileName, type: file.type, folder: bucketFolder });

    // Use local backend for uploads (has /send-upload endpoint)
    const response = await axios.post(`${API_URL_UPLOAD}/send-upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      timeout: 30000, // 30 second timeout
    });

    console.log('[Upload] Response:', response?.data);

    if (response?.data?.url) {
      return response.data.url;
    }

    // Fallback: return full response if URL not found
    return response.data;
  } catch (error) {
    console.error('Error in upload:', error?.response?.data || error.message || error);
    throw error;
  }
};
