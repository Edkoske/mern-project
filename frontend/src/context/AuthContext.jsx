import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import { authApi } from '../services/api';

const STORAGE_KEY = 'airesume_token';

export const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshProfile: async () => {},
});

const getStoredToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(getStoredToken);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const persistToken = useCallback((value) => {
    try {
      if (typeof window !== 'undefined') {
        if (value) {
          window.localStorage.setItem(STORAGE_KEY, value);
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      // ignore browser storage errors (private mode, etc.)
    }
    setToken(value);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) {
      setUser(null);
      return null;
    }

    try {
      const response = await authApi.profile();
      setUser(response.user);
      return response.user;
    } catch (error) {
      persistToken(null);
      setUser(null);
      return null;
    }
  }, [token, persistToken]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    refreshProfile().finally(() => setLoading(false));
  }, [token, refreshProfile]);

  const login = useCallback(
    async (payload) => {
      const data = await authApi.login(payload);
      persistToken(data.token);
      setUser(data.user);
      return data;
    },
    [persistToken],
  );

  const register = useCallback(
    async (payload) => {
      const data = await authApi.register(payload);
      persistToken(data.token);
      setUser(data.user);
      return data;
    },
    [persistToken],
  );

  const logout = useCallback(() => {
    persistToken(null);
    setUser(null);
  }, [persistToken]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout,
      refreshProfile,
    }),
    [loading, login, logout, refreshProfile, register, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthProvider;
