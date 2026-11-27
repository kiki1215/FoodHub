import axiosClient from './axiosClient';

export const userService = {
  getMyProfile() {
    return axiosClient.get('/users/me');
  },

  updateMyProfile(payload) {
    return axiosClient.put('/users/me', payload);
  },

  updateMyAvatarUrl(avatarUrl) {
    return axiosClient.patch('/users/me/avatar', { avatarUrl });
  },

  uploadMyAvatarFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient.post('/users/me/avatar-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
