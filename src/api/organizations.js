import api from './axios';

export const getMyOrganizations = () => api.get('/organizations');
export const createOrganization  = (data) => api.post('/organizations', data);
export const updateOrganization  = (id, data) => api.put(`/organizations/${id}`, data);
export const getPublicOrganization = (id) => api.get(`/organizations/${id}/public`);
export const getPublicCompetition  = (orgId, compId) => api.get(`/organizations/${orgId}/competitions/${compId}/public`);
export const getPublicDivision     = (orgId, divId)  => api.get(`/organizations/${orgId}/divisions/${divId}/public`);
