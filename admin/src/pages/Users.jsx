// ============================================
// USMON SHASHLIK — Admin Users (Customers) Page
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/helpers';
import { t } from '../utils/i18n';

export default function Users({ lang = 'uz' }) {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getUsers({ search });
      setUsers(Array.isArray(res) ? res : res.users || []);
      setTotal(res.total || (Array.isArray(res) ? res.length : 0));
    } catch (err) {
      showToast(err.message || 'Foydalanuvchilarni yuklashda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleToggleBlock = async (user) => {
    try {
      await adminAPI.toggleUserBlock(user.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isBlocked: !u.isBlocked } : u))
      );
      showToast(user.isBlocked ? 'Foydalanuvchi blokdan chiqarildi' : 'Foydalanuvchi bloklandi', 'success');
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi', 'error');
    }
  };

  const handleExportCsv = () => {
    window.open(adminAPI.exportUsersCsvUrl(), '_blank');
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>{t('users', lang)}</h1>
          <p>Bot va Mini App orqali ro'yxatdan o'tgan mijozlar ({total} nafar)</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handleExportCsv}>
            📥 {t('export_csv', lang)}
          </button>
          <button className="btn btn-primary" onClick={loadUsers}>
            🔄 Yangilash
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="header-search" style={{ width: '320px' }}>
            <span>🔍</span>
            <input
              type="text"
              placeholder="Ism, telefon yoki Telegram ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mijoz</th>
                <th>Telegram ID</th>
                <th>Telefon</th>
                <th>Til</th>
                <th>Buyurtmalar</th>
                <th>Holati</th>
                <th>Ro'yxatdan o'tgan</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                    Mijozlar topilmadi
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} style={{ opacity: u.isBlocked ? 0.6 : 1 }}>
                    <td>
                      <div>
                        <strong>{u.firstName} {u.lastName || ''}</strong>
                        {u.username && (
                          <div style={{ fontSize: '12px', color: '#3b82f6' }}>
                            @{u.username}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {u.telegramId ? u.telegramId.toString() : '—'}
                    </td>
                    <td>{u.phone || '—'}</td>
                    <td>
                      <span className="badge badge-info" style={{ textTransform: 'uppercase' }}>
                        {u.language || 'uz'}
                      </span>
                    </td>
                    <td>
                      <strong>{u._count?.orders ?? u.orders?.length ?? 0}</strong> ta
                    </td>
                    <td>
                      {u.isBlocked ? (
                        <span className="badge badge-cancelled">Bloklangan</span>
                      ) : (
                        <span className="badge badge-completed">Faol</span>
                      )}
                    </td>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                      {formatDate(u.createdAt)}
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${u.isBlocked ? 'btn-secondary' : 'btn-danger'}`}
                        onClick={() => handleToggleBlock(u)}
                        style={{ fontSize: '11px' }}
                      >
                        {u.isBlocked ? '🔓 Ochish' : '🔒 Bloklash'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
