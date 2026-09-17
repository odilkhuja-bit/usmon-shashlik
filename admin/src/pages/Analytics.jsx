// ============================================
// USMON SHASHLIK — Admin Analytics Page
// ============================================

import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { formatPrice } from '../utils/helpers';
import { t } from '../utils/i18n';

export default function Analytics({ lang = 'uz' }) {
  const [period, setPeriod] = useState('30');
  const [revenueData, setRevenueData] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [branchStats, setBranchStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [revData, popData, branchesData] = await Promise.all([
        adminAPI.getRevenueChart({ period }).catch(() => []),
        adminAPI.getPopularProducts({ limit: 10 }).catch(() => []),
        adminAPI.getBranchStats().catch(() => []),
      ]);

      setRevenueData(Array.isArray(revData) ? revData : []);
      setPopularProducts(Array.isArray(popData) ? popData : []);
      setBranchStats(Array.isArray(branchesData) ? branchesData : []);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const totalPeriodRevenue = revenueData.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
  const maxBarRevenue = Math.max(...revenueData.map((d) => d.revenue || 0), 100000);

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>{t('analytics', lang)}</h1>
          <p>Sotuvlar tahlili, ommabop taomlar va filiallar statistikasi</p>
        </div>
        <div className="page-actions">
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className={`btn btn-sm ${period === '7' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPeriod('7')}
            >
              7 kun
            </button>
            <button
              className={`btn btn-sm ${period === '14' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPeriod('14')}
            >
              14 kun
            </button>
            <button
              className={`btn btn-sm ${period === '30' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPeriod('30')}
            >
              30 kun
            </button>
          </div>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <div className="stat-title">Davr bo'yicha tushum</div>
            <div className="stat-value">{formatPrice(totalPeriodRevenue)}</div>
            <div className="stat-subtext">So'nggi {period} kun ichida</div>
          </div>
          <div className="stat-icon orange">📈</div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-title">O'rtacha kunlik tushum</div>
            <div className="stat-value">
              {formatPrice(Math.round(totalPeriodRevenue / (parseInt(period) || 1)))}
            </div>
            <div className="stat-subtext">Bir kunlik o'rtacha</div>
          </div>
          <div className="stat-icon blue">📊</div>
        </div>
      </div>

      {/* Revenue Graph Card */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div className="card-header">
          <h3 className="card-title">Tushum Grafiki ({period} kunlik)</h3>
        </div>
        <div className="card-body">
          {revenueData.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
              Ma'lumotlar mavjud emas
            </div>
          ) : (
            <div className="chart-bar-container" style={{ height: '220px' }}>
              {revenueData.map((d, idx) => {
                const heightPercent = Math.max(6, Math.round(((d.revenue || 0) / maxBarRevenue) * 100));
                return (
                  <div key={idx} className="chart-bar-col">
                    <div style={{ fontSize: '9px', color: '#64748b' }}>
                      {d.revenue > 0 ? `${Math.round(d.revenue / 1000)}k` : ''}
                    </div>
                    <div
                      className="chart-bar-fill"
                      style={{ height: `${heightPercent}%`, borderRadius: '4px 4px 0 0' }}
                      title={`${d.date}: ${formatPrice(d.revenue)}`}
                    />
                    <span className="chart-bar-label">{d.date?.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Grid: Popular Dishes & Branch Comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Popular Dishes */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Eng Ko'p Buyurtma Qilingan Taomlar</h3>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Taom</th>
                  <th>Sotilgan miqdor</th>
                </tr>
              </thead>
              <tbody>
                {popularProducts.length === 0 ? (
                  <tr>
                    <td colSpan="2" style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                      Ma'lumotlar yo'q
                    </td>
                  </tr>
                ) : (
                  popularProducts.map((p, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{idx + 1}. {p.name}</td>
                      <td>
                        <strong style={{ color: '#e85d04' }}>{p.count} dona</strong>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Branch Stats */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Filiallar Bo'yicha Natijalar</h3>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Filial</th>
                  <th>Buyurtmalar</th>
                  <th>Mijozlar</th>
                </tr>
              </thead>
              <tbody>
                {branchStats.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                      Ma'lumotlar yo'q
                    </td>
                  </tr>
                ) : (
                  branchStats.map((b) => (
                    <tr key={b.id || b.name}>
                      <td style={{ fontWeight: 600 }}>{b.name}</td>
                      <td>
                        <span className="badge badge-info">{b._count?.orders || 0} ta</span>
                      </td>
                      <td>{b._count?.users || 0} nafar</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
