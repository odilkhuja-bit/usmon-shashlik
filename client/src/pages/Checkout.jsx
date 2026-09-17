// ============================================
// USMON SHASHLIK — Checkout Page
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useCart } from '../context/CartContext';
import { orderAPI } from '../services/api';
import { t, getBranchName } from '../utils/i18n';
import { formatPrice } from '../utils/helpers';
import { haptic } from '../utils/telegram';

export default function Checkout() {
  const navigate = useNavigate();
  const { user, language, selectedBranch, settings } = useApp();
  const { items, subtotal, clearCart } = useCart();

  const [name, setName] = useState(user?.firstName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [deliveryType, setDeliveryType] = useState('DELIVERY');
  const [address, setAddress] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const deliveryPrice = deliveryType === 'DELIVERY' ? parseInt(settings.delivery_price || '20000') : 0;
  const total = subtotal + deliveryPrice;

  const deliveryOptions = [
    { type: 'DELIVERY', label: t('delivery', language) },
    { type: 'PICKUP', label: t('pickup', language) },
    { type: 'DINE_IN', label: t('dine_in', language) },
  ];

  const handleSubmit = async () => {
    setError('');

    if (!name.trim()) { setError(language === 'ru' ? 'Введите имя' : 'Ismingizni kiriting'); return; }
    if (!phone.trim()) { setError(language === 'ru' ? 'Введите телефон' : 'Telefon raqamingizni kiriting'); return; }
    if (deliveryType === 'DELIVERY' && !address.trim()) { setError(language === 'ru' ? 'Введите адрес' : 'Manzilingizni kiriting'); return; }
    if (!selectedBranch) { setError(language === 'ru' ? 'Выберите филиал' : 'Filialni tanlang'); return; }

    try {
      setSubmitting(true);
      haptic('medium');

      const orderData = {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        branchId: selectedBranch.id,
        deliveryType,
        phone: phone.trim(),
        address: deliveryType === 'DELIVERY' ? address.trim() : null,
        comment: comment.trim() || null,
      };

      const result = await orderAPI.create(orderData);

      clearCart();
      haptic('success');
      navigate('/order-success', { state: { order: result } });
    } catch (err) {
      setError(err.message);
      haptic('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page" style={{ paddingTop: '16px', paddingBottom: '100px' }}>
      <h1 className="page-title">{t('checkout_title', language)}</h1>

      {/* Name */}
      <div className="input-group">
        <label className="input-label">{t('your_name', language)}</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('your_name', language)} />
      </div>

      {/* Phone */}
      <div className="input-group">
        <label className="input-label">{t('phone', language)}</label>
        <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" />
      </div>

      {/* Branch */}
      {selectedBranch && (
        <div className="input-group">
          <label className="input-label">{t('branch', language)}</label>
          <div className="input" style={{ background: 'var(--color-bg-secondary)', cursor: 'default' }}>
            📍 {getBranchName(selectedBranch, language)}
          </div>
        </div>
      )}

      {/* Delivery Type */}
      <div className="input-group">
        <label className="input-label">{t('delivery_type', language)}</label>
        <div className="delivery-options">
          {deliveryOptions.map((opt) => (
            <div
              key={opt.type}
              className={`delivery-option ${deliveryType === opt.type ? 'active' : ''}`}
              onClick={() => { setDeliveryType(opt.type); haptic('light'); }}
            >
              <span className="delivery-option-text">{opt.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Address (only for delivery) */}
      {deliveryType === 'DELIVERY' && (
        <div className="input-group">
          <label className="input-label">{t('address', language)}</label>
          <textarea
            className="input textarea"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={language === 'ru' ? 'Район, улица, дом, квартира' : 'Tuman, ko\'cha, uy, xonadon'}
          />
        </div>
      )}

      {/* Comment */}
      <div className="input-group">
        <label className="input-label">{t('comment', language)}</label>
        <textarea
          className="input textarea"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={language === 'ru' ? 'Пожелания к заказу...' : 'Buyurtmaga izoh...'}
          rows={2}
        />
      </div>

      {/* Order Summary */}
      <div className="cart-summary">
        {items.map((item) => (
          <div key={item.productId} className="cart-summary-row" style={{ fontSize: '13px' }}>
            <span>{language === 'ru' ? (item.nameRu || item.name) : item.name} × {item.quantity}</span>
            <span>{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
        <div className="cart-summary-row" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--color-border-light)' }}>
          <span>{t('delivery_fee', language)}</span>
          <span>{deliveryPrice > 0 ? formatPrice(deliveryPrice) : t('free', language)}</span>
        </div>
        <div className="cart-summary-total">
          <span>{t('total', language)}</span>
          <span>{formatPrice(total)} so'm</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p style={{ color: 'var(--color-error)', fontSize: '13px', fontWeight: 600, textAlign: 'center', marginTop: '12px' }}>
          {error}
        </p>
      )}

      {/* Submit */}
      <div style={{ marginTop: '20px' }}>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? (language === 'ru' ? 'Отправка...' : 'Yuborilmoqda...') : t('confirm_order', language)}
        </button>
      </div>
    </div>
  );
}
