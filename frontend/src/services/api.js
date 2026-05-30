import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api',
  withCredentials: true,
});

let csrfToken = null;

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length !== 2) return null;
  return decodeURIComponent(parts.pop().split(';').shift());
};

const isUnsafeMethod = (method = 'get') => ['post', 'put', 'patch', 'delete'].includes(method.toLowerCase());

api.interceptors.request.use((config) => {
  if (isUnsafeMethod(config.method)) {
    const token = csrfToken ?? getCookie('XSRF-TOKEN');
    if (token) {
      config.headers['X-XSRF-TOKEN'] = token;
    }
  }
  return config;
});

export const ensureCsrfToken = async () => {
  const response = await api.get('/auth/csrf');
  csrfToken = response.data?.token ?? null;
};

export const getApiErrorMessage = (error, fallback = 'Wystąpił błąd.') => {
  const data = error.response?.data;

  if (data?.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
    return Object.values(data.fieldErrors)[0];
  }

  if (data?.message) {
    return data.message;
  }

  if (typeof data === 'string') {
    return data;
  }

  return fallback;
};

export default api;
