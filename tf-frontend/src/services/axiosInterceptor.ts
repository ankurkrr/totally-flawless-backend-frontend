import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { asynchEnums } from '../constants/enums';
import { API_URL } from '../store/url';


let headers = {};

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers,
});

axiosInstance.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem(asynchEnums.ACCESS_TOKEN);
    console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.data ? JSON.stringify(config.data).substring(0, 200) : '');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      config.headers.Authorization = '';
    }
    return config;
  },
  error => {
    console.error(`[API ERROR] ${error.message}`, error.response?.data || 'No response data');
    return Promise.reject(error);
  },
);

export default axiosInstance;
