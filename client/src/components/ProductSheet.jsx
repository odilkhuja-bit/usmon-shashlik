// ============================================
// USMON SHASHLIK — Product Bottom Sheet
// ============================================

import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { t, getProductName, getProductDesc, getProductIngredients } from '../utils/i18n';
import { formatPrice, calcDiscount } from '../utils/helpers';
import { haptic } from '../utils/telegram';

export default function ProductSheet({ product, onClose }) {
  const { language } = useApp();
  const { addItem, getItemQuantity } = useCart();
  const { showToast } = useToast();
  const [quantity, setQuantity] = useState(Math.max(1, getItemQuantity(product?.id)));
  const [imgError, setImgError] = useState(false);

  if (!product) return null;

  const name = getProductName(product, language);
  const desc = getProductDesc(product, language);
  const ingredients = getProductIngredients(product, language);
  const discount = calcDiscount(product.oldPrice, product.price);
  const totalPrice = product.price * quantity;

  const handleAdd = () => {
    addItem(product, quantity);
    haptic('success');
    showToast(t('added_to_cart', language));
    onClose();
  };

  return (
    <>
      <div className={`sheet-overlay open`} onClick={onClose} />
      <div className={`sheet open`}>
        <div className="sheet-handle" />

        {(product.imageUrl || product.image) && !imgError ? (
          <img
            className="sheet-image"
            src={product.imageUrl || product.image}
            alt={name}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="sheet-image" style={{ background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>🍢</div>
        )}

        <div className="sheet-body">
          <h2 className="sheet-name">{name}</h2>

          {desc && <p className="sheet-desc">{desc}</p>}

          {ingredients && (
            <p className="sheet-ingredients">
              {t('ingredients', language)}: {ingredients}
            </p>
          )}

          <div className="sheet-price-row">
            <span className="sheet-price">{formatPrice(product.price)} so'm</span>
            {product.oldPrice && (
              <span className="sheet-old-price">{formatPrice(product.oldPrice)} so'm</span>
            )}
            {discount > 0 && (
              <span className="product-card-discount" style={{ position: 'static' }}>-{discount}%</span>
            )}
          </div>

          {product.isAvailable !== false && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', margin: '24px 0' }}>
                <div className="qty-selector">
                  <button className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                  <span className="qty-value">{quantity}</span>
                  <button className="qty-btn" onClick={() => setQuantity(quantity + 1)}>+</button>
                </div>
              </div>

              <button className="btn btn-primary" onClick={handleAdd}>
                {t('add_to_cart', language)} — {formatPrice(totalPrice)} so'm
              </button>
            </>
          )}

          {product.isAvailable === false && (
            <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginTop: '24px', fontWeight: 600 }}>
              {t('unavailable', language)}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
