// ============================================
// USMON SHASHLIK — Order Success Page
// ============================================

import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { t } from '../utils/i18n';
import { closeApp } from '../utils/telegram';

export default function OrderSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useApp();
  const order = location.state?.order;

  return (
    <div className="order-success">
      <div className="success-checkmark">✓</div>
      <h1 className="success-title">{t('order_confirmed_title', language)}</h1>
      {order && <p className="success-number">{language === 'ru' ? 'Заказ' : 'Buyurtma'} #{order.orderNumber}</p>}
      <p className="success-text">{t('order_confirmed_text', language)}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '300px' }}>
        <button className="btn btn-primary" onClick={() => navigate('/orders')}>
          {t('my_orders', language)}
        </button>
        <button className="btn btn-secondary" onClick={() => closeApp()}>
          {t('close', language)}
        </button>
      </div>
    </div>
  );
}
