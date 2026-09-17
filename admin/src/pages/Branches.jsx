// ============================================
// USMON SHASHLIK — Admin Branches Page
// ============================================

import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { t } from '../utils/i18n';

export default function Branches({ lang = 'uz' }) {
  const { isSuperAdmin } = useAuth();
  const { showToast } = useToast();

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    latitude: 41.2995,
    longitude: 69.2401,
    workingHours: '10:00 - 23:00',
    isActive: true,
  });

  const loadBranches = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getBranches();
      setBranches(data);
    } catch (err) {
      showToast(err.message || 'Filiallarni yuklashda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleOpenCreate = () => {
    setEditingBranch(null);
    setFormData({
      name: '',
      address: '',
      phone: '',
      latitude: 41.2995,
      longitude: 69.2401,
      workingHours: '10:00 - 23:00',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b) => {
    setEditingBranch(b);
    setFormData({
      name: b.name || '',
      address: b.address || '',
      phone: b.phone || '',
      latitude: b.latitude || 41.2995,
      longitude: b.longitude || 69.2401,
      workingHours: b.workingHours || '10:00 - 23:00',
      isActive: b.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      };

      if (editingBranch) {
        await adminAPI.updateBranch(editingBranch.id, payload);
        showToast('Filial muvaffaqiyatli yangilandi!', 'success');
      } else {
        await adminAPI.createBranch(payload);
        showToast('Yangi filial qo\'shildi!', 'success');
      }

      setIsModalOpen(false);
      loadBranches();
    } catch (err) {
      showToast(err.message || 'Saqlashda xatolik yuz berdi', 'error');
    }
  };

  const handleToggleActive = async (branch) => {
    try {
      await adminAPI.updateBranch(branch.id, { isActive: !branch.isActive });
      setBranches((prev) =>
        prev.map((b) => (b.id === branch.id ? { ...b, isActive: !b.isActive } : b))
      );
      showToast('Filial holati yangilandi', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Haqiqatan ham ushbu filialni o\'chirmoqchimisiz?')) return;
    try {
      await adminAPI.deleteBranch(id);
      showToast('Filial o\'chirildi', 'success');
      loadBranches();
    } catch (err) {
      showToast(err.message || 'O\'chirishda xatolik', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>{t('branches', lang)}</h1>
          <p>Restoran manzillari, ish vaqtlari va telefon raqamlari</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            + Yangi filial qo'shish
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Filial nomi</th>
                <th>Manzil</th>
                <th>Telefon</th>
                <th>Ish vaqti</th>
                <th>Koordinatalar</th>
                <th>Holati</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : branches.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                    Filiallar topilmadi
                  </td>
                </tr>
              ) : (
                branches.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <strong>{b.name}</strong>
                    </td>
                    <td>{b.address}</td>
                    <td>{b.phone || '—'}</td>
                    <td>{b.workingHours || '10:00 - 23:00'}</td>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                      {b.latitude}, {b.longitude}
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${b.isActive ? 'btn-secondary' : 'btn-danger'}`}
                        onClick={() => handleToggleActive(b)}
                        style={{ fontSize: '11px' }}
                      >
                        {b.isActive ? '● Ochiq' : '○ Yopiq'}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(b)}
                        >
                          ✏️
                        </button>
                        {isSuperAdmin && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(b.id)}
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

      {/* Branch Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBranch ? 'Filialni tahrirlash' : 'Yangi filial qo\'shish'}
        maxWidth="600px"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Filial nomi *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Masalan: Chilonzor filiali"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Manzil *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Masalan: Chilonzor tumani, 9-mavze, 12-uy"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Telefon raqam</label>
              <input
                type="text"
                className="form-control"
                placeholder="+998 90 123 45 67"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Ish vaqti</label>
              <input
                type="text"
                className="form-control"
                placeholder="10:00 - 23:00"
                value={formData.workingHours}
                onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Kenglik (Latitude)</label>
              <input
                type="number"
                step="any"
                className="form-control"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Uzunlik (Longitude)</label>
              <input
                type="number"
                step="any"
                className="form-control"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              Filial faol (mijozlarga ko'rinadi va buyurtma qabul qiladi)
            </label>
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
              {editingBranch ? 'Saqlash' : 'Qo\'shish'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
