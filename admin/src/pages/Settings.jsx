// ============================================
// USMON SHASHLIK — Admin Settings Page
// ============================================

import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { t } from '../utils/i18n';

export default function Settings({ lang = 'uz' }) {
  const { isSuperAdmin } = useAuth();
  const { showToast } = useToast();

  const [settings, setSettings] = useState({
    restaurant_name: '',
    restaurant_phone: '',
    telegram_username: '',
    delivery_price: '20000',
    minimum_order: '50000',
    working_hours: '09:00 - 23:00',
    default_language: 'uz',
    hero_title_uz: '',
    hero_title_ru: '',
    hero_image: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPass, setSavingPass] = useState(false);

  useEffect(() => {
    adminAPI
      .getSettings()
      .then((data) => {
        setSettings((prev) => ({ ...prev, ...data }));
      })
      .catch((err) => {
        showToast(err.message || 'Sozlamalarni yuklab bo\'lmadi', 'error');
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await adminAPI.updateSettings(settings);
      showToast('Sozlamalar saqlandi!', 'success');
    } catch (err) {
      showToast(err.message || 'Saqlashda xatolik', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('Yangi parollar mos kelmadi', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Parol kamida 6 belgidan iborat bo\'lishi kerak', 'error');
      return;
    }

    try {
      setSavingPass(true);
      await adminAPI.changePassword({ oldPassword, newPassword });
      showToast('Parol muvaffaqiyatli o\'zgartirildi!', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err.message || 'Parolni o\'zgartirishda xatolik', 'error');
    } finally {
      setSavingPass(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '30px', textAlign: 'center' }}>Yuklanmoqda...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>{t('settings', lang)}</h1>
          <p>Tizim, restoran ma'lumotlari, yetkazib berish narxlari va parolni boshqaring</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Main Restaurant Settings */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Restoran va Yetkazib berish sozlamalari</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSaveSettings}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Restoran nomi</label>
                  <input
                    type="text"
                    className="form-control"
                    value={settings.restaurant_name}
                    onChange={(e) => setSettings({ ...settings, restaurant_name: e.target.value })}
                    disabled={!isSuperAdmin}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Asosiy aloqa telefoni</label>
                  <input
                    type="text"
                    className="form-control"
                    value={settings.restaurant_phone}
                    onChange={(e) => setSettings({ ...settings, restaurant_phone: e.target.value })}
                    disabled={!isSuperAdmin}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Yetkazib berish narxi (so'm)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={settings.delivery_price}
                    onChange={(e) => setSettings({ ...settings, delivery_price: e.target.value })}
                    disabled={!isSuperAdmin}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Minimal buyurtma summasi (so'm)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={settings.minimum_order}
                    onChange={(e) => setSettings({ ...settings, minimum_order: e.target.value })}
                    disabled={!isSuperAdmin}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Telegram kanal / bot username</label>
                  <input
                    type="text"
                    className="form-control"
                    value={settings.telegram_username}
                    onChange={(e) => setSettings({ ...settings, telegram_username: e.target.value })}
                    disabled={!isSuperAdmin}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Ish vaqti</label>
                  <input
                    type="text"
                    className="form-control"
                    value={settings.working_hours}
                    onChange={(e) => setSettings({ ...settings, working_hours: e.target.value })}
                    disabled={!isSuperAdmin}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Bosh sahifa banner rasmi URL</label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.hero_image}
                  onChange={(e) => setSettings({ ...settings, hero_image: e.target.value })}
                  disabled={!isSuperAdmin}
                />
              </div>

              {isSuperAdmin && (
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saqlanmoqda...' : '💾 Sozlamalarni saqlash'}
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Parolni o'zgartirish</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label className="form-label">Joriy parol</label>
                <input
                  type="password"
                  className="form-control"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Yangi parol</label>
                <input
                  type="password"
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Yangi parolni tasdiqlang</label>
                <input
                  type="password"
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-secondary"
                style={{ width: '100%' }}
                disabled={savingPass}
              >
                {savingPass ? 'Yangilanmoqda...' : '🔑 Parolni yangilash'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
