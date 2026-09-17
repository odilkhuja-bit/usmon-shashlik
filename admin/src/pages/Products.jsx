// ============================================
// USMON SHASHLIK — Admin Products Page
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/helpers';
import Modal from '../components/Modal';
import { t } from '../utils/i18n';

export default function Products({ lang = 'uz' }) {
  const { isSuperAdmin } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    nameUz: '',
    nameRu: '',
    descriptionUz: '',
    descriptionRu: '',
    price: '',
    oldPrice: '',
    categoryId: '',
    imageUrl: '',
    isAvailable: true,
    isPopular: false,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        adminAPI.getProducts({
          search,
          categoryId: categoryFilter,
          showDeleted: includeDeleted ? 'all' : 'false',
        }),
        adminAPI.getCategories(),
      ]);

      setProducts(Array.isArray(productsData) ? productsData : productsData?.products || []);
      setCategories(categoriesData);
    } catch (err) {
      showToast(err.message || 'Mahsulotlarni yuklashda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, includeDeleted, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      nameUz: '',
      nameRu: '',
      descriptionUz: '',
      descriptionRu: '',
      price: '',
      oldPrice: '',
      categoryId: categories[0]?.id || '',
      imageUrl: '',
      isAvailable: true,
      isPopular: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setFormData({
      nameUz: p.nameUz || '',
      nameRu: p.nameRu || '',
      descriptionUz: p.descriptionUz || '',
      descriptionRu: p.descriptionRu || '',
      price: p.price || '',
      oldPrice: p.oldPrice || '',
      categoryId: p.categoryId || '',
      imageUrl: p.imageUrl || p.image || '',
      isAvailable: p.isAvailable !== false,
      isPopular: !!p.isPopular,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        imageUrl: formData.imageUrl || null,
        price: Number(formData.price),
        oldPrice: formData.oldPrice ? Number(formData.oldPrice) : null,
      };

      if (editingProduct) {
        await adminAPI.updateProduct(editingProduct.id, payload);
        showToast('Mahsulot yangilandi!', 'success');
      } else {
        await adminAPI.createProduct(payload);
        showToast('Yangi mahsulot qo\'shildi!', 'success');
      }

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message || 'Saqlashda xatolik yuz berdi', 'error');
    }
  };

  const handleToggleAvailability = async (product) => {
    try {
      await adminAPI.updateProduct(product.id, { isAvailable: !product.isAvailable });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isAvailable: !p.isAvailable } : p))
      );
      showToast('Status o\'zgartirildi', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Haqiqatan ham ushbu mahsulotni o\'chirmoqchimisiz?')) return;
    try {
      await adminAPI.deleteProduct(id);
      showToast('Mahsulot o\'chirildi', 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRestore = async (id) => {
    try {
      await adminAPI.restoreProduct(id);
      showToast('Mahsulot qayta tiklandi', 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>{t('products', lang)}</h1>
          <p>Restoran menyusi, shashliklar va taomlar ro'yxati</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            + Yangi taom qo'shish
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="header-search" style={{ width: '280px' }}>
            <span>🔍</span>
            <input
              type="text"
              placeholder="Taom nomini qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Barcha kategoriyalar</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.nameUz}
              </option>
            ))}
          </select>
        </div>

        <div className="toolbar-right">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => setIncludeDeleted(e.target.checked)}
            />
            O'chirilganlarni ko'rsatish
          </label>
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rasm</th>
                <th>Taom nomi</th>
                <th>Kategoriya</th>
                <th>Narxi</th>
                <th>Eski narx</th>
                <th>Mavjudligi</th>
                <th>Status</th>
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
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                    Mahsulotlar topilmadi
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} style={{ opacity: p.isDeleted ? 0.6 : 1 }}>
                    <td>
                      <img
                        src={p.imageUrl || p.image || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=100'}
                        alt={p.nameUz}
                        style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }}
                      />
                    </td>
                    <td>
                      <strong>{p.nameUz}</strong>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{p.nameRu}</div>
                    </td>
                    <td>{p.category?.nameUz || '—'}</td>
                    <td style={{ fontWeight: 700, color: '#e85d04' }}>{formatPrice(p.price)}</td>
                    <td style={{ color: '#94a3b8', textDecoration: 'line-through' }}>
                      {p.oldPrice ? formatPrice(p.oldPrice) : '—'}
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${p.isAvailable ? 'btn-secondary' : 'btn-danger'}`}
                        onClick={() => handleToggleAvailability(p)}
                        style={{ fontSize: '11px' }}
                      >
                        {p.isAvailable ? '✓ Sotuvda' : '✕ Tugagan'}
                      </button>
                    </td>
                    <td>
                      {p.isDeleted ? (
                        <span className="badge badge-cancelled">O'chirilgan</span>
                      ) : (
                        <span className="badge badge-completed">Faol</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(p)}
                          title="Tahrirlash"
                        >
                          ✏️
                        </button>
                        {p.isDeleted ? (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleRestore(p.id)}
                            title="Tiklash"
                          >
                            🔄 Tiklash
                          </button>
                        ) : (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(p.id)}
                            title="O'chirish"
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Taomni tahrirlash' : 'Yangi taom qo\'shish'}
        maxWidth="650px"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-row">
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
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Narxi (so'm) *</label>
              <input
                type="number"
                className="form-control"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Eski narxi (so'm - aksiya bo'lsa)</label>
              <input
                type="number"
                className="form-control"
                value={formData.oldPrice}
                onChange={(e) => setFormData({ ...formData, oldPrice: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Kategoriya *</label>
            <select
              className="form-control"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              required
            >
              <option value="">Kategoriyani tanlang</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.nameUz}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Rasm URL manzili</label>
            <input
              type="text"
              className="form-control"
              placeholder="https://example.com/image.jpg"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tavsif (O'zbekcha)</label>
              <textarea
                className="form-control"
                rows="2"
                value={formData.descriptionUz}
                onChange={(e) => setFormData({ ...formData, descriptionUz: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tavsif (Ruscha)</label>
              <textarea
                className="form-control"
                rows="2"
                value={formData.descriptionRu}
                onChange={(e) => setFormData({ ...formData, descriptionRu: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
              />
              Hozir sotuvda mavjud
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.isPopular}
                onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
              />
              Ommabop / Xit taom
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
              {editingProduct ? 'Saqlash' : 'Qo\'shish'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
