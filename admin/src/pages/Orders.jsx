// ============================================
// USMON SHASHLIK — Admin Orders Management
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';
import { adminSocket } from '../services/socket';
import { useToast } from '../context/ToastContext';
import { formatPrice, formatDate, playOrderSound } from '../utils/helpers';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { t } from '../utils/i18n';

const ORDER_STATUSES = [
  'ALL',
  'NEW',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'DELIVERING',
  'COMPLETED',
  'CANCELLED',
];

export default function Orders({ lang = 'uz' }) {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (branchFilter) params.branchId = branchFilter;
      if (search) params.search = search;

      const res = await adminAPI.getOrders(params);
      setOrders(Array.isArray(res) ? res : res.orders || []);
    } catch (err) {
      showToast(err.message || 'Buyurtmalarni yuklashda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, branchFilter, search, showToast]);

  useEffect(() => {
    adminAPI.getBranches().then(setBranches).catch(() => {});
  }, []);

  useEffect(() => {
    loadOrders();

    const cleanupNew = adminSocket.on('new-order', (newOrder) => {
      setOrders((prev) => [newOrder, ...prev]);
      playOrderSound();
      showToast(`Yangi buyurtma qabul qilindi! #${newOrder.orderNumber || newOrder.id.slice(-5)}`, 'success');
    });

    const cleanupStatus = adminSocket.on('order-status-update', ({ orderId, status }) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status }));
      }
    });

    return () => {
      cleanupNew();
      cleanupStatus();
    };
  }, [loadOrders, selectedOrder, showToast]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setIsUpdating(true);
      await adminAPI.updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
      }
      showToast(`Status o'zgartirildi: ${t(`status_${newStatus}`, lang)}`, 'success');
    } catch (err) {
      showToast(err.message || 'Statusni yangilab bo\'lmadi', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportCsv = () => {
    window.open(adminAPI.exportOrdersCsvUrl(), '_blank');
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>{t('orders', lang)}</h1>
          <p>Mijozlardan tushgan buyurtmalarni real vaqt rejimida boshqaring</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handleExportCsv}>
            📥 {t('export_csv', lang)}
          </button>
          <button className="btn btn-primary" onClick={loadOrders}>
            🔄 Yangilash
          </button>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="header-search" style={{ width: '280px' }}>
            <span>🔍</span>
            <input
              type="text"
              placeholder="Qidirish (ism, tel, raqam)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
          >
            <option value="">Barcha filiallar</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter Chips */}
        <div className="toolbar-right" style={{ overflowX: 'auto', paddingBottom: '4px' }}>
          {ORDER_STATUSES.map((st) => (
            <button
              key={st}
              className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter(st)}
              style={{ whiteSpace: 'nowrap' }}
            >
              {st === 'ALL' ? t('all', lang) : t(`status_${st}`, lang)}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>№ Buyurtma</th>
                <th>Mijoz</th>
                <th>Filial</th>
                <th>Turi</th>
                <th>Summa</th>
                <th>Status</th>
                <th>Sana</th>
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
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                    Buyurtmalar topilmadi
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 700 }}>
                      #{order.orderNumber || order.id.slice(-6).toUpperCase()}
                    </td>
                    <td>
                      <div>
                        <strong>{order.customerName || order.user?.firstName || 'Mijoz'}</strong>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {order.customerPhone || order.user?.phone || '—'}
                        </div>
                      </div>
                    </td>
                    <td>{order.branch?.name || 'Asosiy'}</td>
                    <td>
                      <span style={{ textTransform: 'capitalize' }}>
                        {order.deliveryType?.toLowerCase()}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#e85d04' }}>
                      {formatPrice(order.total)}
                    </td>
                    <td>
                      <select
                        className="filter-select"
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        style={{ fontWeight: 600, fontSize: '12px' }}
                      >
                        <option value="NEW">Yangi</option>
                        <option value="CONFIRMED">Tasdiqlangan</option>
                        <option value="PREPARING">Tayyorlanmoqda</option>
                        <option value="READY">Tayyor</option>
                        <option value="DELIVERING">Yetkazilmoqda</option>
                        <option value="COMPLETED">Bajarildi</option>
                        <option value="CANCELLED">Bekor qilindi</option>
                      </select>
                    </td>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                      {formatDate(order.createdAt)}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        👁️ {t('details', lang)}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Buyurtma #${selectedOrder?.orderNumber || selectedOrder?.id?.slice(-6).toUpperCase()}`}
        maxWidth="650px"
      >
        {selectedOrder && (
          <div>
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <StatusBadge status={selectedOrder.status} lang={lang} />
                <span style={{ marginLeft: '10px', fontSize: '13px', color: '#64748b' }}>
                  {formatDate(selectedOrder.createdAt)}
                </span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#e85d04' }}>
                {formatPrice(selectedOrder.total)}
              </div>
            </div>

            {/* Customer & Delivery Details */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                <div>
                  <strong>Mijoz:</strong> {selectedOrder.customerName || selectedOrder.user?.firstName || 'Mijoz'}
                </div>
                <div>
                  <strong>Telefon:</strong> {selectedOrder.customerPhone || selectedOrder.user?.phone || '—'}
                </div>
                <div>
                  <strong>Filial:</strong> {selectedOrder.branch?.name || 'Asosiy'}
                </div>
                <div>
                  <strong>Yetkazib berish turi:</strong> {selectedOrder.deliveryType}
                </div>
                {selectedOrder.deliveryAddress && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <strong>Manzil:</strong> {selectedOrder.deliveryAddress}
                  </div>
                )}
                {selectedOrder.comment && (
                  <div style={{ gridColumn: 'span 2', color: '#f97316' }}>
                    <strong>Izoh:</strong> {selectedOrder.comment}
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>Taomlar ro'yxati</h4>
            <div className="table-container" style={{ marginBottom: '20px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Taom</th>
                    <th>Narxi</th>
                    <th>Soni</th>
                    <th>Jami</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{item.name || item.nameUz}</td>
                      <td>{formatPrice(item.price)}</td>
                      <td>x {item.quantity}</td>
                      <td style={{ fontWeight: 700 }}>{formatPrice(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Status Change Buttons */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                Statusni o'zgartirish:
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={isUpdating}
                  onClick={() => handleStatusChange(selectedOrder.id, 'CONFIRMED')}
                >
                  ✓ Tasdiqlash
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={isUpdating}
                  onClick={() => handleStatusChange(selectedOrder.id, 'PREPARING')}
                >
                  👨‍🍳 Tayyorlanmoqda
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={isUpdating}
                  onClick={() => handleStatusChange(selectedOrder.id, 'READY')}
                >
                  📦 Tayyor
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={isUpdating}
                  onClick={() => handleStatusChange(selectedOrder.id, 'DELIVERING')}
                >
                  🚚 Yetkazilmoqda
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={isUpdating}
                  onClick={() => handleStatusChange(selectedOrder.id, 'COMPLETED')}
                >
                  🏁 Bajarildi
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  disabled={isUpdating}
                  onClick={() => handleStatusChange(selectedOrder.id, 'CANCELLED')}
                >
                  ✕ Bekor qilish
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
