/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from 'react';
import api, { ensureCsrfToken } from '../services/api';

export const AuthContext = createContext();
const LEGACY_AUTH_STORAGE_KEY = 'authHeader';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearLocalAuthState = () => {
    localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
    setUser(null);
  };

  const logout = async () => {
    try {
      await ensureCsrfToken();
      await api.post('/auth/logout');
    } finally {
      clearLocalAuthState();
    }
  };

  useEffect(() => {
    localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);

    api.get('/user/me')
      .then(async response => {
        setUser(response.data);
        await ensureCsrfToken();
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    await ensureCsrfToken();
    setUser(response.data);
  };

  const register = async (email, username, password) => {
    return await api.post('/auth/register', { email, username, password });
  };

  const updateAccountEmail = async (email) => {
    const response = await api.put('/user/me', { email });
    setUser(response.data);
    return response.data;
  };

  const deleteAccount = async () => {
    await api.delete('/user/me');
    clearLocalAuthState();
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      loading,
      updateAccountEmail,
      deleteAccount,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
