import React, { createContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check localStorage on mount for auto-login
  useEffect(() => {
    const savedAuth = localStorage.getItem('isAuthenticated');
    const savedTimestamp = localStorage.getItem('authTimestamp');
    
    if (savedAuth === 'true' && savedTimestamp) {
      // Check if session is still valid (optional: you can add expiry logic)
      const timestamp = parseInt(savedTimestamp);
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000; // 24 hours
      
      if (now - timestamp < oneDay) {
        setIsAuthenticated(true);
      } else {
        // Session expired, clear storage
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('authTimestamp');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = (username, password, rememberMe = false) => {
    // Static credentials
    if (username === 'admin' && password === 'Q1w2e3r4@') {
      setIsAuthenticated(true);
      
      if (rememberMe) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('authTimestamp', Date.now().toString());
      }
      
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('authTimestamp');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

