// ============================================
// USMON SHASHLIK — Status Badge Component
// ============================================

import { t } from '../utils/i18n';

export default function StatusBadge({ status, lang = 'uz' }) {
  const statusLower = (status || '').toLowerCase();

  const labels = {
    new: 'status_NEW',
    confirmed: 'status_CONFIRMED',
    preparing: 'status_PREPARING',
    ready: 'status_READY',
    delivering: 'status_DELIVERING',
    completed: 'status_COMPLETED',
    cancelled: 'status_CANCELLED',
  };

  const key = labels[statusLower] || 'status_NEW';

  return (
    <span className={`badge badge-${statusLower}`}>
      <span style={{ fontSize: '10px' }}>●</span>
      <span>{t(key, lang)}</span>
    </span>
  );
}
