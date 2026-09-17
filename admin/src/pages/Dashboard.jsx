// ============================================
// USMON SHASHLIK — Admin Dashboard Page
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { adminSocket } from '../services/socket';
import { formatPrice, formatDate } from '../utils/helpers';
import StatusBadge from '../components/StatusBadge';
import { t } from '../utils/i18n';

export default function Dashboard({ lang = 'uz' }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    newOrders: 0,
    preparingOrders: 0,
    deliveringOrders: 0,
    totalUsers: 0,
    totalOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [revenueChart, setRevenueChart] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashData, ordersData, chartData, popularData] = await Promise.all([
        adminAPI.getDashboard().catch(() => ({})),
        adminAPI.getOrders({ limit: 5 }).catch(() => ({ orders: [] })),
        adminAPI.getRevenueChart({ period: 7 }).catch(() => []),
        adminAPI.getPopularProducts({ limit: 5 }).catch(() => []),
      ]);

      setStats(dashData);
      setRecentOrders(Array.isArray(ordersData) ? ordersData : ordersData?.orders || []);
      setRevenueChart(Array.isArray(chartData) ? chartData : []);
      setPopularProducts(Array.isArray(popularData) ? popularData : []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    const cleanup = adminSocket.on('new-order', () => {
      loadDashboardData();
    });

    return () => cleanup();
  }, []);

  const activeOrdersCount = (stats.newOrders || 0) + (stats.preparingOrders || 0) + (stats.deliveringOrders || 0);

  // Calculate max revenue for bar chart scaling
  const maxRevenue = Math.max(...revenueChart.map((d) => d.revenue || 0), 100000);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>{t('dashboard', lang)}</h1>
          <p>Restoranning bugungi va umumiy ko'rsatkichlari</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={loadDashboardData}>
            🔄 Yangilash
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/orders')}>
            🛍️ Barcha buyurtmalar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <div className="stat-title">{t('today_revenue', lang)}</div>
            <div className="stat-value">{formatPrice(stats.todayRevenue || 0)}</div>
            <div className="stat-subtext">Bugun tasdiqlangan tushum</div>
          </div>
          <div className="stat-icon orange">💰</div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-title">{t('today_orders', lang)}</div>
            <div className="stat-value">{stats.todayOrders || 0}</div>
            <div className="stat-subtext">Jami {stats.totalOrders || 0} ta buyurtma</div>
          </div>
          <div className="stat-icon blue">🛍️</div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-title">{t('active_orders', lang)}</div>
            <div className="stat-value" style={{ color: activeOrdersCount > 0 ? '#e85d04' : undefined }}>
              {activeOrdersCount}
            </div>
            <div className="stat-subtext">
              {stats.newOrders || 0} yangi • {stats.preparingOrders || 0} oshxonada
            </div>
          </div>
          <div className="stat-icon purple">⚡</div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-title">{t('total_customers', lang)}</div>
            <div className="stat-value">{stats.totalUsers || 0}</div>
            <div className="stat-subtext">Bot va Mini App mijozlari</div>
          </div>
          <div className="stat-icon green">👥</div>
        </div>
      </div>

      {/* Grid: Revenue Chart & Popular Products */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '28px' }}>
        {/* Revenue Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Haftalik Tushum Dinamikasi (so'm)</h3>
          </div>
          <div className="card-body">
            {revenueChart.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>
                Ma'lumotlar mavjud emas
              </div>
            ) : (
              <div className="chart-bar-container">
                {revenueChart.map((item, idx) => {
                  const heightPercent = Math.max(8, Math.round(((item.revenue || 0) / maxRevenue) * 100));
                  const dayLabel = item.date ? item.date.slice(5) : `#${idx + 1}`;
                  return (
                    <div key={idx} className="chart-bar-col">
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
                        {item.revenue > 0 ? (item.revenue >= 1000000 ? `${(item.revenue / 1000000).toFixed(1)}M` : `${Math.round(item.revenue / 1000)}k`) : ''}
                      </div>
                      <div className="chart-bar-fill" style={{ height: `${heightPercent}%` }} />
                      <span className="chart-bar-label">{dayLabel}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Popular Products */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Taomlar</h3>
          </div>
          <div className="card-body">
            {popularProducts.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>
                Hozircha buyurtmalar yo'q
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {popularProducts.map((p, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>{p.name}</span>
                      <span style={{ color: '#e85d04', fontWeight: 700 }}>{p.count} dona</span>
                    </div>
                    <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          background: 'linear-gradient(90deg, #f97316, #e85d04)',
                          width: `${Math.min(100, (p.count / (popularProducts[0]?.count || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">So'nggi Buyurtmalar</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/orders')}>
            Barchasini ko'rish →
          </button>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>№ Buyurtma</th>
                <th>Mijoz</th>
                <th>Filial</th>
                <th>Yetkazib berish</th>
                <th>Summa</th>
                <th>Status</th>
                <th>Sana</th>
                <th>Amal</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                    Hozircha buyurtmalar mavjud emas
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
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
                      <StatusBadge status={order.status} lang={lang} />
                    </td>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                      {formatDate(order.createdAt)}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate('/orders')}
                      >
                        Batafsil
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
