import axios from 'axios';
import { clearAuthStorage, getAccessToken, isJwtExpired } from '../utils/storage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      if (isJwtExpired(token)) {
        clearAuthStorage();
        window.dispatchEvent(
          new CustomEvent('foodhub:unauthorized', {
            detail: { message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.' },
          })
        );
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        status: 408,
        message: 'Yêu cầu quá thời gian phản hồi, vui lòng kiểm tra kết nối và thử lại.',
        fieldErrors: null,
        data: null,
      });
    }

    if (!error.response) {
      return Promise.reject({
        status: 0,
        message: 'Không thể kết nối tới API Gateway. Vui lòng kiểm tra hệ thống Backend.',
        fieldErrors: null,
        data: null,
      });
    }

    const { status, data } = error.response;
    const message =
      (data && typeof data.message === 'string' && data.message) ||
      (status === 401
        ? 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'
        : status === 403
          ? 'Bạn không có quyền thực hiện thao tác này.'
          : 'Đã xảy ra lỗi khi xử lý yêu cầu.');

    const isAuthLoginEndpoint = error.config?.url?.includes('/auth/login');
    if (status === 401 && !isAuthLoginEndpoint) {
      clearAuthStorage();
      window.dispatchEvent(
        new CustomEvent('foodhub:unauthorized', {
          detail: { message },
        })
      );
    }

    const fieldErrors =
      data && data.data && typeof data.data === 'object' && !Array.isArray(data.data)
        ? data.data
        : null;

    return Promise.reject({
      status,
      message,
      fieldErrors,
      data: data?.data ?? null,
    });
  }
);

export default axiosClient;
