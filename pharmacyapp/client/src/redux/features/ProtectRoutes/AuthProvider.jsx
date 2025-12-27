import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 👈 import navigation hook

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    JSON.parse(localStorage.getItem('isAuthenticated')) || false
  );

  const navigate = useNavigate(); // 👈 hook for redirection

  // Automatically logout after 3 hours
  useEffect(() => {
    let timeout;
    if (isAuthenticated) {
      timeout = setTimeout(() => {
        logout(); // 👈 auto logout after 3 hours
      }, 3 * 60 * 60 * 1000); // 3 hours
    }

    return () => clearTimeout(timeout);
  }, [isAuthenticated]);

  const login = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', true);
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token');
    navigate('/login'); // 👈 redirect to login page after logout
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
