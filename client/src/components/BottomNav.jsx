// ============================================
// USMON SHASHLIK — Bottom Navigation
// ============================================

import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useApp } from '../context/AppContext';
import { t } from '../utils/i18n';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const { language } = useApp();

  // Hide on certain pages
  const hiddenPaths = ['/onboarding', '/branch-select', '/checkout', '/order-success'];
  if (hiddenPaths.some((p) => location.pathname.startsWith(p))) return null;

  const items = [
    { path: '/', icon: '🏠', label: t('nav_home', language) },
    { path: '/menu', icon: '🍢', label: t('nav_menu', language) },
    { path: '/cart', icon: '🛒', label: t('nav_cart', language), badge: totalItems },
    { path: '/profile', icon: '👤', label: t('nav_profile', language) },
  ];

  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <button
          key={item.path}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="nav-item-icon">{item.icon}</span>
          <span className="nav-item-label">{item.label}</span>
          {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
        </button>
      ))}
    </nav>
  );
}
