import axiosInstance from './axiosInterceptor';

const apiClient = {
  get: <T = any>(url: string, config?: any) => axiosInstance.get<T>(url, config),
  post: <T = any>(url: string, data?: any, config?: any) => axiosInstance.post<T>(url, data, config),
  put: <T = any>(url: string, data?: any, config?: any) => axiosInstance.put<T>(url, data, config),
  delete: <T = any>(url: string, config?: any) => axiosInstance.delete<T>(url, config),
  setBaseURL: (baseURL: string) => { axiosInstance.defaults.baseURL = baseURL; },
  rawInstance: axiosInstance,
};

export default apiClient;
/**
 * Centralized apiClient
 * This re-exports the existing axios instance (with interceptors)
 * so other modules can import from `services/apiClient` going forward.
 */
