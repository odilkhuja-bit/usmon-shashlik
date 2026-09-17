// ============================================
// USMON SHASHLIK — Favorites Page
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { clientAPI } from '../services/api';
import { t, getProductName, getProductDesc } from '../utils/i18n';
import { formatPrice } from '../utils/helpers';
import { haptic } from '../utils/telegram';
import ProductSheet from '../components/ProductSheet';

export default function Favorites() {
  const navigate = useNavigate();
  const { language } = useApp();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const data = await clientAPI.getFavorites();
      setFavorites(Array.isArray(data) ? data : data?.products || []);
    } catch (err) {
      console.error('Failed to load favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (e, productId) => {
    e.stopPropagation();
    try {
      await clientAPI.toggleFavorite(productId);
      setFavorites((prev) => prev.filter((p) => p.id !== productId));
      haptic('light');
      showToast(language === 'ru' ? 'Удалено из избранного' : 'Sevimlilardan o\'chirildi');
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    }
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    if (!product.isAvailable) return;
    addItem(product, 1);
    haptic('light');
    showToast(t('added_to_cart', language));
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
        <h1 className="page-title" style={{ margin: 0 }}>{t('favorites', language)}</h1>
      </div>

      {loading ? (
        <div className="product-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: '220px', borderRadius: '16px' }} />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❤️</div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            {language === 'ru' ? 'В избранном пусто' : 'Hozircha sevimlilar yo\'q'}
          </h3>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
            {language === 'ru'
              ? 'Добавляйте понравившиеся блюда в избранное, нажав на сердечко.'
              : 'Yoqtirgan taomlaringizni yurakcha belgisini bosib saqlab qo\'ying.'}
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/menu')}>
            {t('view_menu', language)}
          </button>
        </div>
      ) : (
        <div className="product-grid">
          {favorites.map((product) => (
            <div
              key={product.id}
              className="product-card"
              onClick={() => setSelectedProduct(product)}
            >
              <div className="product-card-img-wrap">
                <img
                  src={product.imageUrl || product.image || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400'}
                  alt={getProductName(product, language)}
                  className="product-card-img"
                  loading="lazy"
                />
                <button
                  className="favorite-btn active"
                  onClick={(e) => handleToggleFavorite(e, product.id)}
                  aria-label="Remove favorite"
                >
                  ❤️
                </button>
              </div>
              <div className="product-card-body">
                <h3 className="product-card-title">{getProductName(product, language)}</h3>
                <p className="product-card-desc">{getProductDesc(product, language)}</p>
                <div className="product-card-footer">
                  <span className="product-card-price">{formatPrice(product.price)}</span>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!product.isAvailable}
                    onClick={(e) => handleAddToCart(e, product)}
                  >
                    {product.isAvailable ? '+' : '—'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Details Bottom Sheet */}
      {selectedProduct && (
        <ProductSheet
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
