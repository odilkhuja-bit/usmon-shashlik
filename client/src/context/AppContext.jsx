// ============================================
// USMON SHASHLIK — App Context
// ============================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { clientAPI } from '../services/api';
import { getTelegramUser, getTelegramLanguage } from '../utils/telegram';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('usmon_lang') || getTelegramLanguage() || 'uz';
  });
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang);
    localStorage.setItem('usmon_lang', lang);
    if (user) {
      clientAPI.updateProfile({ language: lang }).catch(() => {});
    }
  }, [user]);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [branchesData, categoriesData, settingsData] = await Promise.all([
        clientAPI.getBranches(),
        clientAPI.getCategories().catch(() => []),
        clientAPI.getSettings().catch(() => ({})),
      ]);

      setBranches(branchesData);
      setCategories(categoriesData);
      setSettings(settingsData);

      // Try to load user profile (may fail without auth)
      try {
        const profile = await clientAPI.getProfile();
        setUser(profile);
        if (profile.language) setLanguageState(profile.language);
        if (profile.selectedBranch) setSelectedBranch(profile.selectedBranch);
      } catch {
        // Not authenticated yet, use Telegram data
        const tgUser = getTelegramUser();
        if (tgUser) {
          setUser({
            firstName: tgUser.first_name,
            lastName: tgUser.last_name,
            username: tgUser.username,
          });
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const selectBranch = useCallback(async (branch) => {
    setSelectedBranch(branch);
    localStorage.setItem('usmon_branch', JSON.stringify(branch));
    try {
      await clientAPI.updateProfile({ selectedBranchId: branch.id });
    } catch {
      // Ignore if not authenticated
    }
  }, []);

  // Restore branch from localStorage if not from server
  useEffect(() => {
    if (!selectedBranch) {
      const saved = localStorage.getItem('usmon_branch');
      if (saved) {
        try { setSelectedBranch(JSON.parse(saved)); } catch {}
      }
    }
  }, [selectedBranch]);

  const value = {
    user,
    setUser,
    language,
    setLanguage,
    selectedBranch,
    selectBranch,
    branches,
    categories,
    settings,
    loading,
    error,
    reload: loadInitialData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
