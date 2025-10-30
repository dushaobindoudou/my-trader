import axios from 'axios';

// Centralized Axios instance for both client and server usage
export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || '',
  timeout: 15000,
  withCredentials: false,
});

// Request interceptor (extend when auth/headers are needed)
http.interceptors.request.use((config) => {
  return config;
});

// Response interceptor for unified error handling
http.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default http;


