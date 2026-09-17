// ============================================
// USMON SHASHLIK — Admin Broadcast Page
// ============================================

import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/helpers';
import Modal from '../components/Modal';
import { t } from '../utils/i18n';

export default function Broadcast({ lang = 'uz' }) {
  const { showToast } = useToast();
  const [history, setHistory] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetCount, setTargetCount] = useState(0);

  // Create Broadcast Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    imageUrl: '',
    targetBranchId: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [historyData, branchesData] = await Promise.all([
        adminAPI.getBroadcastHistory(),
        adminAPI.getBranches(),
      ]);
      setHistory(Array.isArray(historyData) ? historyData : historyData?.broadcasts || []);
      setBranches(branchesData);
    } catch (err) {
      showToast(err.message || 'Ma\'lumotlarni yuklashda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update target recipient estimate when targetBranchId changes
  useEffect(() => {
    if (!isModalOpen) return;
    const params = {};
    if (formData.targetBranchId) params.branchId = formData.targetBranchId;

    adminAPI
      .getTargetCount(params)
      .then((res) => setTargetCount(res.count || 0))
      .catch(() => {});
  }, [formData.targetBranchId, isModalOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      showToast('Sarlavha va xabar matnini kiriting', 'error');
      return;
    }

    try {
      setIsSending(true);
      await adminAPI.createBroadcast(formData);
      showToast('Xabarnoma muvaffaqiyatli jo\'natilmoqda!', 'success');
      setIsModalOpen(false);
      setFormData({ title: '', message: '', imageUrl: '', targetBranchId: '' });
      loadData();
    } catch (err) {
      showToast(err.message || 'Xabarnomani jo\'natishda xatolik', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>{t('broadcast', lang)}</h1>
          <p>Mijozlarga yangilik, aksiya va chegirmalar haqida Telegram xabarnoma yuborish</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            📢 Yangi xabarnoma yuborish
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Yuborilgan Xabarnomalar Tarixi</h3>
          <button className="btn btn-secondary btn-sm" onClick={loadData}>
            🔄 Yangilash
          </button>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sarlavha</th>
                <th>Xabar matni</th>
                <th>Yuborildi</th>
                <th>Xatoliklar</th>
                <th>Holati</th>
                <th>Sana</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                    Hozircha xabarnomalar yuborilmagan
                  </td>
                </tr>
              ) : (
                history.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <strong>{b.title}</strong>
                    </td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#64748b' }}>
                      {b.message}
                    </td>
                    <td>
                      <span className="badge badge-completed">
                        ✓ {b.sentCount || 0} ta
                      </span>
                    </td>
                    <td>
                      {b.failedCount > 0 ? (
                        <span className="badge badge-cancelled">
                          ✕ {b.failedCount} ta
                        </span>
                      ) : (
                        '0'
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${b.status === 'COMPLETED' ? 'completed' : b.status === 'SENDING' ? 'preparing' : 'new'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                      {formatDate(b.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Broadcast Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yangi Telegram Xabarnomasi"
        maxWidth="600px"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Auditoriya / Filial</label>
            <select
              className="form-control"
              value={formData.targetBranchId}
              onChange={(e) => setFormData({ ...formData, targetBranchId: e.target.value })}
            >
              <option value="">Barcha mijozlar ({targetCount} kishi)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  Faqat {b.name} mijozlari
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Xabarnoma sarlavhasi *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Masalan: 🎉 Hafta oxirida 20% chegirma!"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Rasm URL manzili (ixtiyoriy)</label>
            <input
              type="text"
              className="form-control"
              placeholder="https://example.com/promo-banner.jpg"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Xabar matni *</label>
            <textarea
              className="form-control"
              rows="5"
              placeholder="Hurmatli mijozlar! Bugun va ertaga barcha shashliklarimizga maxsus narxlar..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
            />
          </div>

          <div style={{ background: '#fff7ed', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #fed7aa', fontSize: '13px', color: '#c2410c' }}>
            ℹ️ Xabar bot orqali barcha faol Telegram foydalanuvchilariga ketma-ket yuboriladi.
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Bekor qilish
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSending}>
              {isSending ? 'Yuborilmoqda...' : '🚀 Xabarni jo\'natish'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
