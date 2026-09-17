// ============================================
// USMON SHASHLIK — Admin Layout Component
// ============================================

import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { adminSocket } from '../services/socket';
import { adminAPI } from '../services/api';
import { playOrderSound } from '../utils/helpers';
import { t } from '../utils/i18n';

export default function Layout({ lang = 'uz', setLang }) {
  const navigate = useNavigate();
  const { admin, logout, isSuperAdmin } = useAuth();
  const { showToast } = useToast();
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [latestOrderAlert, setLatestOrderAlert] = useState(null);

  useEffect(() => {
    // Load active orders count initially
    adminAPI
      .getOrders({ status: 'NEW' })
      .then((res) => {
        const count = res.total || (Array.isArray(res) ? res.length : 0);
        setNewOrderCount(count);
      })
      .catch(() => {});

    // Listen for new orders via socket
    const cleanupNewOrder = adminSocket.on('new-order', (order) => {
      setNewOrderCount((prev) => prev + 1);
      setLatestOrderAlert(order);
      playOrderSound();
      showToast(`Yangi buyurtma! #${order.orderNumber || order.id?.slice(-5)}`, 'success');
    });

    setIsConnected(true);

    return () => {
      cleanupNewOrder();
    };
  }, [showToast]);

  const navItems = [
    { path: '/', label: t('dashboard', lang), icon: '📊' },
    { path: '/orders', label: t('orders', lang), icon: '🛍️', badge: newOrderCount },
    { path: '/products', label: t('products', lang), icon: '🍢' },
    { path: '/categories', label: t('categories', lang), icon: '📂' },
    { path: '/branches', label: t('branches', lang), icon: '📍' },
    { path: '/users', label: t('users', lang), icon: '👥' },
    { path: '/broadcast', label: t('broadcast', lang), icon: '📢' },
    { path: '/analytics', label: t('analytics', lang), icon: '📈' },
    ...(isSuperAdmin ? [{ path: '/admins', label: t('admins', lang), icon: '🛡️' }] : []),
    { path: '/settings', label: t('settings', lang), icon: '⚙️' },
  ];

  return (
    <div className="admin-wrapper">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-logo-icon">🍢</span>
          <div>
            <div className="sidebar-brand-title">USMON SHASHLIK</div>
            <div className="sidebar-brand-subtitle">Admin Panel</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Asosiy menyu</div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge > 0 && <span className="sidebar-badge">{item.badge}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {admin?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <div className="sidebar-user-name">{admin?.name || 'Administrator'}</div>
              <div className="sidebar-user-role">{admin?.role || 'OPERATOR'}</div>
            </div>
          </div>
          <button
            className="btn-icon"
            onClick={logout}
            title={t('logout', lang)}
            style={{ color: '#ef4444', borderColor: '#334155' }}
          >
            🚪
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="connection-indicator">
            <div className="connection-dot" />
            <span>Real-time online</span>
          </div>

          <div className="header-actions">
            {/* Language Switch */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                className={`btn btn-sm ${lang === 'uz' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLang('uz')}
              >
                UZ
              </button>
              <button
                className={`btn btn-sm ${lang === 'ru' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLang('ru')}
              >
                RU
              </button>
            </div>

            {/* Quick Orders Button */}
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/orders')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>🛍️ Buyurtmalar</span>
              {newOrderCount > 0 && (
                <span style={{ background: '#ffffff', color: '#e85d04', borderRadius: '9999px', padding: '1px 6px', fontSize: '11px', fontWeight: 800 }}>
                  {newOrderCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Body */}
        <main className="admin-body">
          {latestOrderAlert && (
            <div className="order-alert-banner">
              <div>
                <strong>🔔 Yangi buyurtma qabul qilindi!</strong> #{latestOrderAlert.orderNumber || latestOrderAlert.id?.slice(-5)} — {Number(latestOrderAlert.total || 0).toLocaleString()} so'm
              </div>
              <button
                className="btn btn-sm"
                style={{ backgroundColor: '#ffffff', color: '#e85d04' }}
                onClick={() => {
                  setLatestOrderAlert(null);
                  navigate('/orders');
                }}
              >
                Ko'rish →
              </button>
            </div>
          )}

          <Outlet />
        </main>
      </div>
    </div>
  );
}
