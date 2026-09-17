// ============================================
// USMON SHASHLIK — Cart Page
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { clientAPI } from '../services/api';
import { t, getProductName } from '../utils/i18n';
import { formatPrice } from '../utils/helpers';
import { haptic } from '../utils/telegram';

export default function Cart() {
  const navigate = useNavigate();
  const { language, settings } = useApp();
  const { items, updateQuantity, removeItem, subtotal, addItem } = useCart();
  const { showToast } = useToast();
  const [upsellProducts, setUpsellProducts] = useState([]);

  const deliveryPrice = parseInt(settings.delivery_price || '20000');
  const minimumOrder = parseInt(settings.minimum_order || '0');
  const total = subtotal + deliveryPrice;

  useEffect(() => {
    clientAPI.getUpsellProducts().then(setUpsellProducts).catch(() => {});
  }, []);

  // Filter out already-in-cart items from upsell
  const filteredUpsell = upsellProducts.filter(
    (p) => !items.some((item) => item.productId === p.id)
  );

  const handleUpsellAdd = (product) => {
    addItem(product, 1);
    haptic('light');
    showToast(t('added_to_cart', language));
  };

  if (items.length === 0) {
    return (
      <div className="page" style={{ paddingTop: '16px' }}>
        <h1 className="page-title">{t('cart_title', language)}</h1>
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <div className="empty-state-title">{t('cart_empty_title', language)}</div>
          <p className="empty-state-text">{t('cart_empty_text', language)}</p>
          <button className="btn btn-primary" onClick={() => navigate('/menu')}>
            {t('view_menu', language)}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingTop: '16px' }}>
      <h1 className="page-title">{t('cart_title', language)}</h1>

      {/* Cart Items */}
      <div>
        {items.map((item) => {
          const name = language === 'ru' ? (item.nameRu || item.name) : item.name;
          return (
            <div key={item.productId} className="cart-item">
              {item.imageUrl ? (
                <img
                  className="cart-item-image"
                  src={item.imageUrl}
                  alt={name}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="cart-item-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-secondary)', fontSize: '24px' }}>🍢</div>
              )}

              <div className="cart-item-info">
                <div>
                  <div className="cart-item-name">{name}</div>
                  <div className="cart-item-price">{formatPrice(item.price)} so'm</div>
                </div>

                <div className="cart-item-actions">
                  <div className="qty-selector">
                    <button
                      className="qty-btn"
                      onClick={() => { updateQuantity(item.productId, item.quantity - 1); haptic('light'); }}
                    >
                      −
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => { updateQuantity(item.productId, item.quantity + 1); haptic('light'); }}
                    >
                      +
                    </button>
                  </div>

                  <div className="cart-item-total">{formatPrice(item.price * item.quantity)} so'm</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upsell */}
      {filteredUpsell.length > 0 && (
        <div className="upsell-section">
          <div className="upsell-title">{t('upsell_title', language)}</div>
          {filteredUpsell.slice(0, 3).map((product) => (
            <div key={product.id} className="upsell-item">
              {product.imageUrl && (
                <img className="upsell-item-image" src={product.imageUrl} alt={getProductName(product, language)} onError={(e) => { e.target.style.display = 'none'; }} />
              )}
              <div className="upsell-item-info">
                <div className="upsell-item-name">{getProductName(product, language)}</div>
                <div className="upsell-item-price">{formatPrice(product.price)} so'm</div>
              </div>
              <button className="upsell-add-btn" onClick={() => handleUpsellAdd(product)}>
                + {t('add', language)}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="cart-summary">
        <div className="cart-summary-row">
          <span>{t('products_total', language)}</span>
          <span>{formatPrice(subtotal)} so'm</span>
        </div>
        <div className="cart-summary-row">
          <span>{t('delivery_fee', language)}</span>
          <span>{deliveryPrice > 0 ? `${formatPrice(deliveryPrice)} so'm` : t('free', language)}</span>
        </div>
        <div className="cart-summary-total">
          <span>{t('total', language)}</span>
          <span>{formatPrice(total)} so'm</span>
        </div>
      </div>

      {/* Minimum order warning */}
      {minimumOrder > 0 && subtotal < minimumOrder && (
        <p style={{ color: 'var(--color-warning)', fontSize: '13px', fontWeight: 600, textAlign: 'center', marginTop: '12px' }}>
          {t('min_order_warning', language)}: {formatPrice(minimumOrder)} so'm
        </p>
      )}

      {/* Proceed */}
      <div style={{ marginTop: '20px', paddingBottom: '16px' }}>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/checkout')}
          disabled={minimumOrder > 0 && subtotal < minimumOrder}
        >
          {t('proceed', language)} — {formatPrice(total)} so'm
        </button>
      </div>
    </div>
  );
}
