import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data)
};

// Profile API
export const profileAPI = {
    get: () => api.get('/profile'),
    update: (data) => api.put('/profile', data)
};

// Moods API
export const moodsAPI = {
    getAll: (days = 7) => api.get(`/moods?days=${days}`),
    getStats: (days = 7) => api.get(`/moods/stats?days=${days}`),
    create: (data) => api.post('/moods', data),
    delete: (id) => api.delete(`/moods/${id}`)
};

// Journal API
export const journalAPI = {
    getAll: (days = 7, type = null) => {
        const url = type ? `/journal?days=${days}&type=${type}` : `/journal?days=${days}`;
        return api.get(url);
    },
    create: (data) => api.post('/journal', data),
    update: (id, data) => api.put(`/journal/${id}`, data),
    delete: (id) => api.delete(`/journal/${id}`)
};

// Symptoms API
export const symptomsAPI = {
    getAll: (days = 7, type = null) => {
        const url = type ? `/symptoms?days=${days}&type=${type}` : `/symptoms?days=${days}`;
        return api.get(url);
    },
    getStats: (days = 7) => api.get(`/symptoms/stats?days=${days}`),
    create: (data) => api.post('/symptoms', data),
    delete: (id) => api.delete(`/symptoms/${id}`)
};

// Triggers API
export const triggersAPI = {
    getAll: () => api.get('/triggers'),
    create: (data) => api.post('/triggers', data),
    logOccurrence: (id) => api.post(`/triggers/${id}/occurrence`),
    update: (id, data) => api.put(`/triggers/${id}`, data),
    delete: (id) => api.delete(`/triggers/${id}`)
};

// Coping Strategies API
export const copingAPI = {
    getAll: () => api.get('/coping'),
    create: (data) => api.post('/coping', data),
    use: (id, rating) => api.post(`/coping/${id}/use`, { rating }),
    update: (id, data) => api.put(`/coping/${id}`, data),
    delete: (id) => api.delete(`/coping/${id}`)
};

// Emergency Contacts API
export const contactsAPI = {
    getAll: () => api.get('/contacts'),
    create: (data) => api.post('/contacts', data),
    update: (id, data) => api.put(`/contacts/${id}`, data),
    delete: (id) => api.delete(`/contacts/${id}`)
};

// Goals API
export const goalsAPI = {
    getAll: (completed = false) => api.get(`/goals?completed=${completed}`),
    create: (data) => api.post('/goals', data),
    complete: (id) => api.patch(`/goals/${id}/complete`),
    update: (id, data) => api.put(`/goals/${id}`, data),
    delete: (id) => api.delete(`/goals/${id}`)
};

export default api;
