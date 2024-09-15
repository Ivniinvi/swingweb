import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api'; // Make sure this path is correct

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = () => {
    const lastLoginTime = localStorage.getItem('lastLoginTime');
    if (lastLoginTime) {
      const hoursSinceLogin = (new Date() - new Date(lastLoginTime)) / (1000 * 60 * 60);
      if (hoursSinceLogin <= 24) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('lastLoginTime');
      }
    }
  };

  const login = async (password) => {
    try {
      const response = await api.post('/login', { password });
      if (response.data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('lastLoginTime', new Date().toISOString());
        return true;
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('lastLoginTime');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);