// ============================================
// USMON SHASHLIK — Orders Page (Order History)
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { orderAPI } from '../services/api';
import { t, getProductName, getBranchName } from '../utils/i18n';
import { formatPrice, formatDate } from '../utils/helpers';
import { haptic } from '../utils/telegram';

export default function Orders() {
  const navigate = useNavigate();
  const { language } = useApp();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await orderAPI.getMyOrders();
      setOrders(Array.isArray(data) ? data : data?.orders || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'COMPLETED': return 'badge-success';
      case 'CANCELLED': return 'badge-danger';
      case 'DELIVERING':
      case 'READY': return 'badge-info';
      default: return 'badge-warning';
    }
  };

  const handleReorder = (order) => {
    if (!order.items || !Array.isArray(order.items)) return;
    order.items.forEach((item) => {
      const product = {
        id: item.productId,
        nameUz: item.nameUz,
        nameRu: item.nameRu,
        price: item.price,
        imageUrl: item.imageUrl || item.image,
        isAvailable: true,
      };
      addItem(product, item.quantity || 1);
    });
    haptic('success');
    showToast(t('added_to_cart', language));
    navigate('/cart');
  };

  return (
    <div className="page" style={{ paddingTop: '16px', paddingBottom: '90px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button
          className="btn-icon"
          onClick={() => navigate(-1)}
          style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer' }}
        >
          ‹
        </button>
        <h1 className="page-title" style={{ margin: 0 }}>{t('order_history', language)}</h1>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '14px' }} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📜</div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            {language === 'ru' ? 'Заказов пока нет' : 'Hozircha buyurtmalar yo\'q'}
          </h3>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
            {language === 'ru'
              ? 'Сделайте ваш первый заказ прямо сейчас!'
              : 'Birinchi buyurtmangizni hoziroq bering!'}
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/menu')}>
            {t('view_menu', language)}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {orders.map((order) => {
            const isExpanded = selectedOrder?.id === order.id;
            return (
              <div
                key={order.id}
                className="card"
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  border: '1px solid #f0f0f0',
                  background: '#fff',
                }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setSelectedOrder(isExpanded ? null : order)}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>
                      #{order.orderNumber || order.id.slice(-6).toUpperCase()}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge ${getStatusClass(order.status)}`}>
                      {t(`status_${order.status}`, language)}
                    </span>
                    <div style={{ fontWeight: 700, fontSize: '15px', marginTop: '4px', color: '#e85d04' }}>
                      {formatPrice(order.total)}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f3f4f6' }}>
                    {order.branch && (
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                        📍 {getBranchName(order.branch, language)}
                      </div>
                    )}
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px' }}>
                      🚚 {t(order.deliveryType?.toLowerCase() || 'delivery', language)}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                      {order.items?.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span>
                            {getProductName(item, language)} x {item.quantity}
                          </span>
                          <span style={{ fontWeight: 600 }}>{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      onClick={() => handleReorder(order)}
                    >
                      <span>🔄</span>
                      <span>{t('reorder', language)}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
