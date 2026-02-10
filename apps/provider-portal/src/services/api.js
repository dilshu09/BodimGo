import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Backend URL
  withCredentials: true, // For HTTP-Only Cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
