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

/**
 * Delete a file from GCS via backend AND clear profileImage in database
 * @param {string} fileUrl - The full GCS URL of the file to delete
 * @param {string} userId - The user ID to clear profileImage for
 * @returns {Promise<boolean>} - True if deleted successfully
 */
export const deleteFromStorage = async (fileUrl, userId) => {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/f8c9b63d-614d-4ebb-81a0-9d686c172b89', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'S3UploadService.js:deleteFromStorage:entry', message: 'Delete called', data: { fileUrl, userId }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'DELETE' }) }).catch(() => { });
    // #endregion

    if (!fileUrl) {
      console.log('[Delete] No fileUrl provided, skipping');
      return true;
    }

    if (!userId) {
      console.log('[Delete] No userId provided, cannot clear DB');
      return false;
    }

    // Only delete GCS URLs
    if (!fileUrl.includes('storage.googleapis.com')) {
      console.log('[Delete] Not a GCS URL, skipping:', fileUrl);
      return true;
    }

    console.log('[Delete] Deleting from storage:', fileUrl);
    console.log('[Delete] For userId:', userId);
    console.log('[Delete] Calling:', `${API_URL_UPLOAD}/delete-upload`);

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/f8c9b63d-614d-4ebb-81a0-9d686c172b89', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'S3UploadService.js:deleteFromStorage:beforeRequest', message: 'About to call delete endpoint', data: { url: `${API_URL_UPLOAD}/delete-upload`, fileUrl, userId }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'DELETE' }) }).catch(() => { });
    // #endregion

    // Send both fileUrl AND userId - backend will delete from GCS AND clear DB
    const response = await axios.post(`${API_URL_UPLOAD}/delete-upload`, { fileUrl, userId }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/f8c9b63d-614d-4ebb-81a0-9d686c172b89', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'S3UploadService.js:deleteFromStorage:response', message: 'Delete response received', data: { status: response?.status, data: response?.data }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'DELETE' }) }).catch(() => { });
    // #endregion

    console.log('[Delete] Response:', response?.data);
    return response?.data?.status === 'success';
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/f8c9b63d-614d-4ebb-81a0-9d686c172b89', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'S3UploadService.js:deleteFromStorage:error', message: 'Delete error', data: { error: error?.message || String(error) }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'DELETE' }) }).catch(() => { });
    // #endregion
    console.error('Error in delete:', error?.response?.data || error.message || error);
    throw error;
  }
};
