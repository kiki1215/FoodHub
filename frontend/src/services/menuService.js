import axiosClient from './axiosClient';

export const menuService = {
  getCategories(keyword) {
    return axiosClient.get('/categories', {
      params: keyword ? { keyword } : undefined,
    });
  },

  getProducts(params = {}) {
    return axiosClient.get('/products', { params });
  },

  getProductById(id) {
    return axiosClient.get(`/products/${id}`);
  },

  getBestSellers(limit = 4, timeSlot) {
    return axiosClient.get('/products/best-sellers', {
      params: { limit, ...(timeSlot ? { timeSlot } : {}) },
    });
  },

  getProductsByIds(ids = []) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return Promise.resolve({ success: true, data: [] });
    }
    return axiosClient.get('/products/by-ids', {
      params: { ids: ids.join(',') },
    });
  },
};
