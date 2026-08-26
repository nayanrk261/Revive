import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, signupUser, fetchCurrentUser, completeOnboarding } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('revive_token') || null);
  const [demoMode, setDemoMode] = useState(localStorage.getItem('revive_demo_mode') === 'true');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('revive_token');
      if (storedToken) {
        try {
          const res = await fetchCurrentUser();
          if (res.success && res.user) {
            setUser(res.user);
            setDemoMode(false);
            localStorage.setItem('revive_demo_mode', 'false');
          } else {
            localStorage.removeItem('revive_token');
            setToken(null);
            setUser(null);
          }
        } catch (err) {
          console.warn('[AUTH] Token load failed, resetting:', err.message);
          localStorage.removeItem('revive_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await loginUser(email, password);
    if (res.success) {
      setToken(res.token);
      setUser(res.user);
      setDemoMode(false);
      localStorage.setItem('revive_token', res.token);
      localStorage.setItem('revive_demo_mode', 'false');
    }
    return res;
  };

  const signup = async (payload) => {
    const res = await signupUser(payload);
    if (res.success) {
      setToken(res.token);
      setUser(res.user);
      setDemoMode(false);
      localStorage.setItem('revive_token', res.token);
      localStorage.setItem('revive_demo_mode', 'false');
    }
    return res;
  };

  const enterDemoMode = () => {
    setToken(null);
    setUser(null);
    setDemoMode(true);
    localStorage.removeItem('revive_token');
    localStorage.setItem('revive_demo_mode', 'true');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setDemoMode(false);
    localStorage.removeItem('revive_token');
    localStorage.setItem('revive_demo_mode', 'false');
  };

  const setOnboardingDone = async () => {
    try {
      await completeOnboarding();
    } catch (e) {
      console.warn(e);
    }
    if (user) {
      setUser({ ...user, onboardingComplete: true });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        demoMode,
        loading,
        login,
        signup,
        enterDemoMode,
        logout,
        setOnboardingDone
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
