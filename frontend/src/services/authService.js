import axiosClient from './axiosClient';

export const authService = {
  register(payload) {
    return axiosClient.post('/auth/register', payload);
  },

  login(payload) {
    return axiosClient.post('/auth/login', payload);
  },
};
