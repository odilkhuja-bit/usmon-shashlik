// ============================================
// USMON SHASHLIK — Admin Team Management Page
// ============================================

import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { t } from '../utils/i18n';

export default function Admins({ lang = 'uz' }) {
  const { isSuperAdmin, admin: currentAdmin } = useAuth();
  const { showToast } = useToast();

  const [admins, setAdmins] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'OPERATOR',
    branchId: '',
    isActive: true,
  });

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const [adminsData, branchesData] = await Promise.all([
        adminAPI.getAdmins(),
        adminAPI.getBranches(),
      ]);
      setAdmins(adminsData);
      setBranches(branchesData);
    } catch (err) {
      showToast(err.message || 'Adminlar ro\'yxatini yuklashda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleOpenCreate = () => {
    setEditingAdmin(null);
    setFormData({
      username: '',
      password: '',
      name: '',
      role: 'OPERATOR',
      branchId: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a) => {
    setEditingAdmin(a);
    setFormData({
      username: a.username,
      password: '',
      name: a.name || '',
      role: a.role,
      branchId: a.branchId || '',
      isActive: a.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAdmin) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await adminAPI.updateAdmin(editingAdmin.id, payload);
        showToast('Admin ma\'lumotlari yangilandi', 'success');
      } else {
        if (!formData.password) {
          showToast('Parolni kiritish shart', 'error');
          return;
        }
        await adminAPI.createAdmin(formData);
        showToast('Yangi admin yaratildi', 'success');
      }

      setIsModalOpen(false);
      loadAdmins();
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (id === currentAdmin?.id) {
      showToast('O\'zingizning profilingizni o\'chira olmaysiz', 'error');
      return;
    }
    if (!window.confirm('Ushbu adminni o\'chirmoqchimisiz?')) return;
    try {
      await adminAPI.deleteAdmin(id);
      showToast('Admin o\'chirildi', 'success');
      loadAdmins();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (!isSuperAdmin) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Kirish cheklangan</h2>
        <p>Ushbu bo'lim faqat SUPER_ADMIN uchun ochiq.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>{t('admins', lang)}</h1>
          <p>Tizim xodimlari, filial menejerlari va operatorlar</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            + Yangi xodim qo'shish
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ism / F.I.SH</th>
                <th>Login</th>
                <th>Roli</th>
                <th>Filial</th>
                <th>Holati</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : (
                admins.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <strong>{a.name || 'Admin'}</strong>
                    </td>
                    <td>
                      <code>{a.username}</code>
                    </td>
                    <td>
                      <span className={`badge badge-${a.role === 'SUPER_ADMIN' ? 'preparing' : a.role === 'ADMIN' ? 'confirmed' : 'info'}`}>
                        {a.role}
                      </span>
                    </td>
                    <td>{a.branch?.name || 'Barcha filiallar'}</td>
                    <td>
                      <span className={`badge ${a.isActive ? 'badge-completed' : 'badge-cancelled'}`}>
                        {a.isActive ? 'Faol' : 'Nofaol'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(a)}
                        >
                          ✏️
                        </button>
                        {a.id !== currentAdmin?.id && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(a.id)}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAdmin ? 'Adminni tahrirlash' : 'Yangi admin yaratish'}
        maxWidth="500px"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">To'liq ismi *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Masalan: Jamshid Usmonov"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Login (Username) *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Masalan: manager1"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              disabled={!!editingAdmin}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {editingAdmin ? 'Yangi parol (o\'zgartirish uchun)' : 'Parol *'}
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingAdmin}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Roli *</label>
            <select
              className="form-control"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
            >
              <option value="OPERATOR">OPERATOR (Faqat buyurtmalarni boshqarish)</option>
              <option value="ADMIN">ADMIN (Mahsulotlar, filiallar, tahlil)</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN (Barcha huquqlar)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Biriktirilgan filial (ixtiyoriy)</label>
            <select
              className="form-control"
              value={formData.branchId}
              onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
            >
              <option value="">Barcha filiallar</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Bekor qilish
            </button>
            <button type="submit" className="btn btn-primary">
              {editingAdmin ? 'Saqlash' : 'Yaratish'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
