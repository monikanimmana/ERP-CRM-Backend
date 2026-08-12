import axios from 'axios';

const API_URL = 'http://localhost:4000';

const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add JWT to all requests
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — redirect to login
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jwt_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const api = {
  client,
  login: (email: string, password: string) =>
    client.post('/auth/login', { email, password }),

  getCustomers: (page = 1, limit = 20) =>
    client.get('/customers', { params: { page, limit } }),

  getProducts: (page = 1, limit = 20) =>
    client.get('/products', { params: { page, limit } }),

  getChallans: (page = 1, limit = 20) =>
    client.get('/challans', { params: { page, limit } }),
};
