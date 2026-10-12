import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, sessionAPI } from '../services/api';

const AuthContext = createContext(null);

// Keeps the last signed-in profile on this device so the app can open offline.
const USER_CACHE_KEY = 'ra_cached_user';
const cacheUser = (value) => { try { if (value) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(value)); } catch { /* storage full or blocked */ } };
const readCachedUser = () => { try { return JSON.parse(localStorage.getItem(USER_CACHE_KEY) || 'null'); } catch { return null; } };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    // When the connection comes back, re-check the session in the background.
    const onOnline = () => { if (localStorage.getItem('token')) checkAuth(true); };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async (isRetry = false) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await authAPI.getMe();
      setUser(response.data.data);
      cacheUser(response.data.data);
      setLoading(false);
    } catch (error) {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        // Token really is invalid/expired — this is the only case that
        // should force a re-login.
        localStorage.removeItem('token');
        localStorage.removeItem(USER_CACHE_KEY);
        setUser(null);
        setLoading(false);
        return;
      }
      // No internet: open the app with the last known profile (saved videos stay watchable).
      if (!error.response && navigator.onLine === false) {
        const cached = readCachedUser();
        if (cached) setUser(cached);
        setLoading(false);
        return;
      }
      // Network error, timeout, or a 5xx (e.g. the backend is still waking
      // up from a Render free-tier cold start). The token is still fine —
      // retry once after a short delay instead of logging the user out.
      if (!isRetry) {
        setTimeout(() => checkAuth(true), 3000);
        return;
      }
      // Second attempt also failed for a non-auth reason: keep the token
      // (so the next reload can succeed once the backend is up) and just
      // stop the spinner. The user stays logged out for this page load
      // only, not permanently.
      setLoading(false);
    }
  };

  const login = async (identifier, password) => {
    const response = await authAPI.login({ identifier, password });
    const data = response.data.data || {};
    if (data.requiresTwoFactor) return data;
    const { user, token } = data;
    localStorage.setItem('token', token);
    setUser(user);
    cacheUser(user);
    return user;
  };

  const register = async (username, email, password, fullName, phoneNumber) => {
    const response = await authAPI.register({ username, email, password, fullName, phoneNumber });
    const { user, token } = response.data.data;
    localStorage.setItem('token', token);
    setUser(user);
    cacheUser(user);
    return user;
  };

  const logout = async () => {
    try { if (localStorage.getItem('token')) await sessionAPI.logout(); } catch (error) { console.warn('Session logout request failed', error); }
    localStorage.removeItem('token');
    localStorage.removeItem(USER_CACHE_KEY);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    cacheUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}