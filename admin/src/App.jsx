// ============================================
// USMON SHASHLIK — Admin App Component
// ============================================

import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Branches from './pages/Branches';
import Users from './pages/Users';
import Broadcast from './pages/Broadcast';
import Analytics from './pages/Analytics';
import Admins from './pages/Admins';
import Settings from './pages/Settings';

function ProtectedRoutes({ lang, setLang }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <h3>Yuklanmoqda...</h3>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout lang={lang} setLang={setLang} />;
}

export default function App() {
  const [lang, setLang] = useState('uz');

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoutes lang={lang} setLang={setLang} />}>
              <Route path="/" element={<Dashboard lang={lang} />} />
              <Route path="/orders" element={<Orders lang={lang} />} />
              <Route path="/products" element={<Products lang={lang} />} />
              <Route path="/categories" element={<Categories lang={lang} />} />
              <Route path="/branches" element={<Branches lang={lang} />} />
              <Route path="/users" element={<Users lang={lang} />} />
              <Route path="/broadcast" element={<Broadcast lang={lang} />} />
              <Route path="/analytics" element={<Analytics lang={lang} />} />
              <Route path="/admins" element={<Admins lang={lang} />} />
              <Route path="/settings" element={<Settings lang={lang} />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
