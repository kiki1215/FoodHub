import axiosClient from './axiosClient';

export const cartService = {
  getMyCart() {
    return axiosClient.get('/cart');
  },

  addItem(productId, quantity = 1) {
    return axiosClient.post('/cart/items', { productId, quantity });
  },

  updateItemQuantity(productId, quantity) {
    return axiosClient.put(`/cart/items/${productId}`, { quantity });
  },

  increaseItem(productId) {
    return axiosClient.patch(`/cart/items/${productId}/increase`);
  },

  decreaseItem(productId) {
    return axiosClient.patch(`/cart/items/${productId}/decrease`);
  },

  removeItem(productId) {
    return axiosClient.delete(`/cart/items/${productId}`);
  },

  clearCart() {
    return axiosClient.delete('/cart');
  },
};
