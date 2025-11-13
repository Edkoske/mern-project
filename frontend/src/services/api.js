import axios from 'axios';

const resolveApiUrl = () => {
  const raw = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  if (!raw) {
    return 'http://localhost:5000/api';
  }

  const trimmed = raw.trim();
  if (trimmed.toLowerCase().endsWith('/api')) {
    return trimmed;
  }

  return `${trimmed.replace(/\/+$/, '')}/api`;
};

const API_URL = resolveApiUrl();

const getToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage.getItem('airesume_token');
  } catch (error) {
    return null;
  }
};

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    // eslint-disable-next-line no-param-reassign
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message;
    return Promise.reject(new Error(message));
  },
);

const unwrap = (promise) => promise.then((response) => response.data);

export const authApi = {
  login: (payload) => unwrap(api.post('/auth/login', payload)),
  register: (payload) => unwrap(api.post('/auth/register', payload)),
  profile: () => unwrap(api.get('/auth/me')),
};

export const resumeApi = {
  list: () => unwrap(api.get('/resumes')),
  get: (id) => unwrap(api.get(`/resumes/${id}`)),
  create: (payload) => unwrap(api.post('/resumes', payload)),
  update: (id, payload) => unwrap(api.put(`/resumes/${id}`, payload)),
  remove: (id) => unwrap(api.delete(`/resumes/${id}`)),
};

export const aiApi = {
  improveContent: (payload) => unwrap(api.post('/ai/improve', payload)),
  generatePortfolioIntro: (payload) => unwrap(api.post('/ai/portfolio-intro', payload)),
};

export const portfolioApi = {
  get: () => unwrap(api.get('/portfolio')),
  upsert: (payload) => unwrap(api.put('/portfolio', payload)),
  publish: (payload) => unwrap(api.post('/portfolio/publish', payload)),
  unpublish: () => unwrap(api.post('/portfolio/unpublish')),
  getPublic: (slug) => unwrap(api.get(`/portfolio/public/${slug}`)),
};

export default api;
