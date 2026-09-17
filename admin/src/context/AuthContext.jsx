// ============================================
// USMON SHASHLIK — Admin Auth Context
// ============================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';
import { adminSocket } from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem('usmon_admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('usmon_admin_token'));
  const [loading, setLoading] = useState(true);

  // Check current session on mount
  useEffect(() => {
    if (token) {
      adminAPI
        .getMe()
        .then((res) => {
          const user = res.admin || res;
          setAdmin(user);
          localStorage.setItem('usmon_admin_user', JSON.stringify(user));
          adminSocket.connect();
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (username, password) => {
    const res = await adminAPI.login({ username, password });
    const receivedToken = res.token;
    const adminUser = res.admin || res.user;

    localStorage.setItem('usmon_admin_token', receivedToken);
    localStorage.setItem('usmon_admin_user', JSON.stringify(adminUser));

    setToken(receivedToken);
    setAdmin(adminUser);
    adminSocket.connect();
    return adminUser;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('usmon_admin_token');
    localStorage.removeItem('usmon_admin_user');
    setToken(null);
    setAdmin(null);
    adminSocket.disconnect();
  }, []);

  const value = {
    admin,
    token,
    loading,
    isAuthenticated: !!token && !!admin,
    isSuperAdmin: admin?.role === 'SUPER_ADMIN',
    isAdmin: admin?.role === 'SUPER_ADMIN' || admin?.role === 'ADMIN',
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
