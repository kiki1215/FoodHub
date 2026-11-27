import axiosClient from './axiosClient';

export const orderService = {
  validateVoucher(code, subtotal) {
    return axiosClient.post('/orders/validate-voucher', { code, subtotal });
  },

  createOrder(payload, idempotencyKey) {
    const headers = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    return axiosClient.post('/orders', payload, { headers });
  },

  getMyOrders(status) {
    return axiosClient.get('/orders/my', {
      params: status ? { status } : undefined,
    });
  },

  getOrderDetail(orderId) {
    return axiosClient.get(`/orders/${orderId}`);
  },

  cancelMyOrder(orderId, reason) {
    return axiosClient.post(`/orders/${orderId}/cancel`, reason ? { reason } : {});
  },
};
