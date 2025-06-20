import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve essere usato dentro un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('padus_token'));

  // Verifica token al caricamento
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const userData = await authService.verifyToken(token);
          setUser(userData);
        } catch (error) {
          console.error('Token non valido:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      const { user: userData, token: userToken } = response.data;
      
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('padus_token', userToken);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Errore durante il login' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      const { user: newUser, token: userToken } = response.data;
      
      setUser(newUser);
      setToken(userToken);
      localStorage.setItem('padus_token', userToken);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Errore durante la registrazione' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('padus_token');
  };

  // Controlli permessi
  const isAdmin = () => {
    return user?.permissionLevel === 'ADMIN';
  };

  const isStaff = () => {
    return user?.permissionLevel === 'STAFF_BASE' || 
           user?.permissionLevel === 'STAFF_AUTORIZZATO' || 
           user?.permissionLevel === 'ADMIN_SECONDARIO';
  };

  const canAutoApprove = () => {
    return user?.permissionLevel === 'STAFF_AUTORIZZATO' || 
           user?.permissionLevel === 'ADMIN_SECONDARIO' || 
           user?.permissionLevel === 'ADMIN';
  };

  const canManageOthers = () => {
    return user?.permissionLevel === 'ADMIN_SECONDARIO' || 
           user?.permissionLevel === 'ADMIN';
  };

  const canViewDashboard = () => {
    return user?.permissionLevel === 'ADMIN_SECONDARIO' || 
           user?.permissionLevel === 'ADMIN';
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAdmin,
    isStaff,
    canAutoApprove,
    canManageOthers,
    canViewDashboard,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 