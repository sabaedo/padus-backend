const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

// Configurazione axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor per aggiungere token alle richieste
api.interceptors.request.use(
  (config) => {
    const token = process.env.AUTH_TOKEN; // Per backend non c'è localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor per gestire errori 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('Token non valido');
    }
    return Promise.reject(error);
  }
);

const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

const register = async (userData) => {
  const response = await api.post('/auth/register', {
    nome: userData.nome,
    cognome: userData.cognome,
    email: userData.email,
    password: userData.password,
    ruolo: userData.ruolo,
    passwordRuolo: userData.passwordRuolo
  });
  return response.data;
};

const verifyToken = async (token) => {
  const response = await api.get('/auth/verify', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

const refreshToken = async () => {
  const response = await api.post('/auth/refresh');
  return response.data;
};

module.exports = {
  api,
  login,
  register,
  verifyToken,
  refreshToken
};

// Export default per compatibilità
module.exports.default = api; 