'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const initialize = useAuthStore(state => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <AuthContext.Provider value={null}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const user = useAuthStore(state => state.user);
  const loading = useAuthStore(state => state.loading);
  const login = useAuthStore(state => state.login);
  const loginWithGoogle = useAuthStore(state => state.loginWithGoogle);
  const logout = useAuthStore(state => state.logout);
  const updateUser = useAuthStore(state => state.updateUser);

  return {
    user,
    loading,
    login,
    loginWithGoogle,
    logout,
    updateUser
  };
};

export default AuthContext;
