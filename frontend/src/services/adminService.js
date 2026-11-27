import axiosClient from './axiosClient';

export const adminService = {
  // ==================== THỐNG KÊ DASHBOARD ====================
  getUserStats() {
    return axiosClient.get('/admin/stats/users');
  },

  getMenuStats() {
    return axiosClient.get('/admin/stats/menu');
  },

  getOrderStats(params = {}) {
    return axiosClient.get('/admin/stats/orders', { params });
  },

  // ==================== QUẢN LÝ NGƯỜI DÙNG ====================
  getUsers(params = {}) {
    return axiosClient.get('/admin/users', { params });
  },

  getUserDetail(id) {
    return axiosClient.get(`/admin/users/${id}`);
  },

  updateUser(id, payload) {
    return axiosClient.put(`/admin/users/${id}`, payload);
  },

  updateUserRole(id, role) {
    return axiosClient.patch(`/admin/users/${id}/role`, { role });
  },

  updateUserStatus(id, active) {
    return axiosClient.patch(`/admin/users/${id}/status`, { active });
  },

  deleteUser(id) {
    return axiosClient.delete(`/admin/users/${id}`);
  },

  // ==================== QUẢN LÝ DANH MỤC ====================
  getCategories(keyword) {
    return axiosClient.get('/categories', {
      params: keyword ? { keyword } : undefined,
    });
  },

  createCategory(payload) {
    return axiosClient.post('/admin/categories', payload);
  },

  updateCategory(id, payload) {
    return axiosClient.put(`/admin/categories/${id}`, payload);
  },

  deleteCategory(id) {
    return axiosClient.delete(`/admin/categories/${id}`);
  },

  // ==================== QUẢN LÝ MÓN ĂN ====================
  getProducts(params = {}) {
    return axiosClient.get('/products', { params });
  },

  createProduct(payload) {
    return axiosClient.post('/admin/products', payload);
  },

  updateProduct(id, payload) {
    return axiosClient.put(`/admin/products/${id}`, payload);
  },

  updateProductStatus(id, status) {
    return axiosClient.patch(`/admin/products/${id}/status`, { status });
  },

  deleteProduct(id) {
    return axiosClient.delete(`/admin/products/${id}`);
  },

  uploadProductImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient.post('/admin/products/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // ==================== QUẢN LÝ ĐƠN HÀNG ====================
  getOrders(params = {}) {
    return axiosClient.get('/admin/orders', { params });
  },

  getOrderDetail(id) {
    return axiosClient.get(`/admin/orders/${id}`);
  },

  updateOrderStatus(id, status) {
    return axiosClient.patch(`/admin/orders/${id}/status`, { status });
  },
};
