// ============================================
// USMON SHASHLIK — Admin Categories Page
// ============================================

import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { t } from '../utils/i18n';

export default function Categories({ lang = 'uz' }) {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    nameUz: '',
    nameRu: '',
    icon: '🍢',
    sortOrder: 0,
  });

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getCategories();
      setCategories(data);
    } catch (err) {
      showToast(err.message || 'Kategoriyalarni yuklashda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      nameUz: '',
      nameRu: '',
      icon: '🍢',
      sortOrder: categories.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCategory(c);
    setFormData({
      nameUz: c.nameUz || '',
      nameRu: c.nameRu || '',
      icon: c.icon || '🍢',
      sortOrder: c.sortOrder || 0,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        sortOrder: Number(formData.sortOrder),
      };

      if (editingCategory) {
        await adminAPI.updateCategory(editingCategory.id, payload);
        showToast('Kategoriya yangilandi!', 'success');
      } else {
        await adminAPI.createCategory(payload);
        showToast('Yangi kategoriya qo\'shildi!', 'success');
      }

      setIsModalOpen(false);
      loadCategories();
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Haqiqatan ham bu kategoriyani o\'chirmoqchimisiz?')) return;
    try {
      await adminAPI.deleteCategory(id);
      showToast('Kategoriya o\'chirildi', 'success');
      loadCategories();
    } catch (err) {
      showToast(err.message || 'O\'chirishda xatolik yuz berdi', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>{t('categories', lang)}</h1>
          <p>Taom turlari va menyu bo'limlarini boshqaring</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            + Yangi kategoriya
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ikonka</th>
                <th>Nomi (UZ)</th>
                <th>Nomi (RU)</th>
                <th>Tartib</th>
                <th>Mahsulotlar soni</th>
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
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                    Kategoriyalar mavjud emas
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontSize: '24px' }}>{c.icon || '🍢'}</td>
                    <td style={{ fontWeight: 700 }}>{c.nameUz}</td>
                    <td style={{ color: '#64748b' }}>{c.nameRu || '—'}</td>
                    <td>{c.sortOrder}</td>
                    <td>
                      <span className="badge badge-info">
                        {c._count?.products ?? c.products?.length ?? 0} ta taom
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(c)}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(c.id)}
                        >
                          🗑️
                        </button>
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
        title={editingCategory ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}
        maxWidth="500px"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Ikonka (Emoji)</label>
            <input
              type="text"
              className="form-control"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="Masalan: 🍢, 🥗, 🥤"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nomi (O'zbekcha) *</label>
            <input
              type="text"
              className="form-control"
              value={formData.nameUz}
              onChange={(e) => setFormData({ ...formData, nameUz: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nomi (Ruscha)</label>
            <input
              type="text"
              className="form-control"
              value={formData.nameRu}
              onChange={(e) => setFormData({ ...formData, nameRu: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tartib raqami (Sort Order)</label>
            <input
              type="number"
              className="form-control"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
            />
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
              {editingCategory ? 'Saqlash' : 'Qo\'shish'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
