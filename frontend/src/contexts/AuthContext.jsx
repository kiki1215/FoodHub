import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import {
  clearAuthStorage,
  getAccessToken,
  getStoredUser,
  isJwtExpired,
  setAuthStorage,
  updateStoredUser,
} from '../utils/storage';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getAccessToken());
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    clearAuthStorage();
    setToken(null);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const res = await userService.getMyProfile();
    if (res?.data) {
      setUser(res.data);
      updateStoredUser(res.data);
    }
    return res?.data;
  }, []);

  // Đồng bộ phiên đăng nhập khi tải lại trang (F5)
  useEffect(() => {
    let active = true;

    async function hydrateAuth() {
      const savedToken = getAccessToken();
      if (!savedToken || isJwtExpired(savedToken)) {
        clearAuthStorage();
        if (active) {
          setToken(null);
          setUser(null);
          setLoading(false);
        }
        return;
      }

      setToken(savedToken);
      try {
        const res = await userService.getMyProfile();
        if (active && res?.data) {
          setUser(res.data);
          updateStoredUser(res.data);
        }
      } catch (err) {
        if (active && (err?.status === 401 || err?.status === 403)) {
          clearAuthStorage();
          setToken(null);
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    hydrateAuth();
    return () => {
      active = false;
    };
  }, []);

  // Lắng nghe sự kiện 401 hoặc token hết hạn từ Axios Interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('foodhub:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('foodhub:unauthorized', handleUnauthorized);
  }, [logout]);

  const login = useCallback(async ({ email, password, remember = true }) => {
    const res = await authService.login({ email, password });
    const authData = res?.data;
    if (!authData?.token || !authData?.user) {
      throw new Error('Phản hồi đăng nhập không hợp lệ từ máy chủ.');
    }
    setAuthStorage(authData.token, authData.user, remember);
    setToken(authData.token);
    setUser(authData.user);
    return authData.user;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await authService.register(payload);
    return res?.data;
  }, []);

  const updateUserState = useCallback((updatedUser) => {
    if (!updatedUser) return;
    setUser(updatedUser);
    updateStoredUser(updatedUser);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === 'ADMIN',
      isCustomer: user?.role === 'CUSTOMER',
      login,
      register,
      logout,
      refreshProfile,
      updateUserState,
    }),
    [user, token, loading, login, register, logout, refreshProfile, updateUserState]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
