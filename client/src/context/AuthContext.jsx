import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch current user and profile summary using persisted token
  const loadCurrentUser = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/auth/me');
      if (res.data?.success && res.data?.user) {
        setUser(res.data.user);
        setProfile(res.data.profile || null);
        setToken(storedToken);
      } else {
        // In case response does not contain valid user
        localStorage.removeItem('token');
        setUser(null);
        setProfile(null);
        setToken(null);
      }
    } catch (err) {
      console.warn('[Auth] Failed to restore session from token:', err.response?.data?.message || err.message);
      localStorage.removeItem('token');
      setUser(null);
      setProfile(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check auth on component mount
  useEffect(() => {
    loadCurrentUser();

    // Listen for 401 unauthorized events dispatched by apiClient interceptor
    const handleUnauthorized = () => {
      setUser(null);
      setProfile(null);
      setToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [loadCurrentUser]);

  // Login action
  const login = async (email, password) => {
    try {
      setError(null);
      const res = await apiClient.post('/auth/login', { email, password });

      if (res.data?.success && res.data?.token) {
        const receivedToken = res.data.token;
        const receivedUser = res.data.user;

        localStorage.setItem('token', receivedToken);
        setToken(receivedToken);
        setUser(receivedUser);

        // Fetch complete profile in background
        loadCurrentUser();

        return { success: true, user: receivedUser };
      }

      const errMsg = res.data?.message || 'Login failed. Please try again.';
      setError(errMsg);
      return { success: false, error: errMsg };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Invalid email or password.';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  // Register action
  const register = async (name, email, password) => {
    try {
      setError(null);
      const res = await apiClient.post('/auth/register', { name, email, password });

      if (res.data?.success && res.data?.token) {
        const receivedToken = res.data.token;
        const receivedUser = res.data.user;

        localStorage.setItem('token', receivedToken);
        setToken(receivedToken);
        setUser(receivedUser);

        // Fetch complete profile
        loadCurrentUser();

        return { success: true, user: receivedUser };
      }

      const errMsg = res.data?.message || 'Registration failed.';
      setError(errMsg);
      return { success: false, error: errMsg };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed. Please check your details.';
      const fieldErrors = err.response?.data?.errors || null;
      setError(errMsg);
      return { success: false, error: errMsg, errors: fieldErrors };
    }
  };

  // Logout action
  const logout = async () => {
    try {
      // Best-effort logout notification to backend
      await apiClient.post('/auth/logout').catch(() => {});
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setProfile(null);
      setError(null);
    }
  };

  const value = {
    user,
    profile,
    token,
    isAuthenticated: Boolean(user && token),
    loading,
    error,
    login,
    register,
    logout,
    refreshUser: loadCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
