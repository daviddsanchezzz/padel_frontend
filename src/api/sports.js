import api from './axios';
export const getSports = () => api.get('/sports');
