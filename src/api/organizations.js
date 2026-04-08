import api from './axios';

export const getMyOrganizations = () => api.get('/organizations');
export const createOrganization  = (data) => api.post('/organizations', data);
export const updateOrganization  = (id, data) => api.put(`/organizations/${id}`, data);
export const getPublicOrganization = (id) => api.get(`/organizations/${id}/public`);
