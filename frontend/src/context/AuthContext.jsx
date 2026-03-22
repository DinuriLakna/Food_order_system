import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('fo_auth');
    if (saved) {
      try { const p = JSON.parse(saved); setUser(p.user); setToken(p.token); } catch {}
    }
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    sessionStorage.setItem('fo_auth', JSON.stringify({ user: userData, token: authToken }));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('fo_auth');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
