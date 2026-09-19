// ============================================
// USMON SHASHLIK — Profile Page
// ============================================

import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { t, getBranchName } from '../utils/i18n';

export default function Profile() {
  const navigate = useNavigate();
  const { user, language, setLanguage, selectedBranch, settings, branches = [] } = useApp();

  const firstName = user?.firstName || (language === 'ru' ? 'Гость' : 'Mehmon');
  const initial = firstName.charAt(0).toUpperCase();

  const branchContactItems = branches.filter(b => b.phone).map(b => ({
    icon: '📞',
    text: `${b.name || (language === 'ru' ? b.nameRu : '')} (${b.phone})`,
    action: () => window.open(`tel:${b.phone.replace(/\s+/g, '')}`)
  }));

  const menuItems = [
    { icon: '📜', text: t('order_history', language), action: () => navigate('/orders') },
    { icon: '❤️', text: t('favorites', language), action: () => navigate('/favorites') },
    { icon: '📍', text: t('change_branch_menu', language), action: () => navigate('/branch-select') },
    ...branchContactItems,
    { icon: 'ℹ️', text: t('about', language), action: () => window.open('https://www.instagram.com/usmon_shashlik?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==', '_blank') },
  ];

  return (
    <div className="page" style={{ paddingTop: '16px' }}>
      <h1 className="page-title">{t('profile', language)}</h1>

      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">{initial}</div>
        <div>
          <div className="profile-name">{firstName} {user?.lastName || ''}</div>
          {user?.phone && <div className="profile-phone">{user.phone}</div>}
          {selectedBranch && (
            <div className="profile-phone">📍 {getBranchName(selectedBranch, language)}</div>
          )}
        </div>
      </div>

      {/* Language Switch */}
      <div style={{ marginBottom: '20px' }}>
        <label className="input-label">{t('language', language)}</label>
        <div className="lang-switch">
          <button
            className={`lang-option ${language === 'uz' ? 'active' : ''}`}
            onClick={() => setLanguage('uz')}
          >
            🇺🇿 O'zbekcha
          </button>
          <button
            className={`lang-option ${language === 'ru' ? 'active' : ''}`}
            onClick={() => setLanguage('ru')}
          >
            🇷🇺 Русский
          </button>
        </div>
      </div>

      {/* Menu Items */}
      <div className="profile-menu">
        {menuItems.map((item, i) => (
          <div key={i} className="profile-menu-item" onClick={item.action}>
            <div className="profile-menu-icon">{item.icon}</div>
            <div className="profile-menu-text">{item.text}</div>
            <div className="profile-menu-arrow">›</div>
          </div>
        ))}
      </div>
    </div>
  );
}
