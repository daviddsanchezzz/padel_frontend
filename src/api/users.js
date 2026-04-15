import api from './axios';
export const getAdminUsers = () => api.get('/users/admin');
