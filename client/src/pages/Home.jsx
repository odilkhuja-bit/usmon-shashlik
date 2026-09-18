// ============================================
// USMON SHASHLIK — Home Page
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { clientAPI } from '../services/api';
import { t, getProductName, getCategoryName, getBranchName } from '../utils/i18n';
import { formatPrice, calcDiscount } from '../utils/helpers';
import { haptic } from '../utils/telegram';
import ProductSheet from '../components/ProductSheet';

export default function Home() {
  const navigate = useNavigate();
  const { user, language, selectedBranch, categories, settings } = useApp();
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const { showToast } = useToast();
  const [stories, setStories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [storyViewer, setStoryViewer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [storiesData, productsData] = await Promise.all([
        clientAPI.getStories().catch(() => []),
        clientAPI.getProducts(),
      ]);
      setStories(storiesData);
      setProducts(productsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.categoryId === selectedCategory)
    : products;

  const handleQuickAdd = (e, product) => {
    e.stopPropagation();
    if (!product.isAvailable) return;
    addItem(product, 1);
    haptic('light');
    showToast(t('added_to_cart', language));
  };

  const firstName = user?.firstName || '';
  const heroTitle = language === 'ru'
    ? (settings.hero_title_ru || 'НАСТОЯЩИЙ ШАШЛЫК.\nНАСТОЯЩЕЕ УДОВОЛЬСТВИЕ.')
    : (settings.hero_title_uz || 'HAQIQIY SHASHLIK.\nHAQIQIY MAZZA.');

  return (
    <div>
      {/* Header */}
      <div className="header">
        <h1 className="header-greeting">
          {t('greeting', language)}, {firstName} 👋
        </h1>
        <p className="header-subtitle">{t('greeting_subtitle', language)}</p>

        {selectedBranch && (
          <div className="header-branch" onClick={() => navigate('/branch-select')}>
            <span>📍</span>
            <span className="header-branch-name">{getBranchName(selectedBranch, language)}</span>
            <span style={{ marginLeft: 'auto', fontSize: '12px' }}>›</span>
          </div>
        )}
      </div>

      {/* Stories */}
      {stories.length > 0 && (
        <div className="stories-container">
          {stories.map((story) => (
            <div key={story.id} className="story-item" onClick={() => setStoryViewer(story)}>
              <div className="story-ring" style={{ background: `linear-gradient(135deg, ${story.bgColor || '#E85D04'}, #F48C06)` }}>
                <img src={story.imageUrl} alt={story.title} onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
              <div className="story-title">{story.title}</div>
            </div>
          ))}
        </div>
      )}

      {/* Hero */}
      <div className="hero" onClick={() => navigate('/menu')}>
        <img
          src={settings.hero_image || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80'}
          alt="USMON SHASHLIK"
          onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><rect fill="%23E85D04" width="800" height="400"/></svg>'; }}
        />
        <div className="hero-overlay">
          <h2 className="hero-title">{heroTitle}</h2>
          <div className="hero-btn">{t('hero_cta', language)}</div>
        </div>
      </div>

      {/* Categories */}
      <div className="categories-scroll">
        <button
          className={`category-chip ${!selectedCategory ? 'active' : ''}`}
          onClick={() => setSelectedCategory(null)}
        >
          {t('all_categories', language)}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-chip ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => { setSelectedCategory(cat.id); haptic('light'); }}
          >
            {cat.icon} {getCategoryName(cat, language)}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="products-grid">
          {[1,2,3,4].map((i) => (
            <div key={i} className="product-card">
              <div className="skeleton" style={{ aspectRatio: '1', width: '100%' }} />
              <div className="product-card-body">
                <div className="skeleton" style={{ height: '16px', width: '80%', marginBottom: '8px' }} />
                <div className="skeleton" style={{ height: '14px', width: '60%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((product) => {
            const discount = calcDiscount(product.oldPrice, product.price);
            return (
              <div
                key={product.id}
                className="product-card"
                onClick={() => setSelectedProduct(product)}
              >
                {discount > 0 && (
                  <span className="product-card-discount">-{discount}%</span>
                )}

                {product.imageUrl ? (
                  <img
                    className="product-card-image"
                    src={product.imageUrl}
                    alt={getProductName(product, language)}
                    loading="lazy"
                    onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="%23f3f4f6" width="200" height="200"/><text x="100" y="100" text-anchor="middle" fill="%239ca3af" font-size="40">🍢</text></svg>'; }}
                  />
                ) : (
                  <div className="product-card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-secondary)', fontSize: '40px' }}>🍢</div>
                )}

                <div className="product-card-body">
                  <div className="product-card-name">{getProductName(product, language)}</div>
                  <div className="product-card-price-row">
                    <div>
                      <span className="product-card-price">{formatPrice(product.price)}</span>
                      {product.oldPrice && (
                        <span className="product-card-old-price">{formatPrice(product.oldPrice)}</span>
                      )}
                    </div>
                    {product.isAvailable !== false && (() => {
                      const cartItem = items.find(i => i.productId === product.id);
                      if (cartItem) {
                        return (
                          <div className="product-qty-inline" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--color-bg-secondary)', padding: '4px', borderRadius: '20px' }}>
                            <button onClick={() => cartItem.quantity > 1 ? updateQuantity(cartItem.productId, cartItem.quantity - 1) : removeItem(cartItem.productId)} style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#fff', border: 'none', fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                            <span style={{ fontSize: '14px', fontWeight: 700, minWidth: '12px', textAlign: 'center' }}>{cartItem.quantity}</span>
                            <button onClick={() => updateQuantity(cartItem.productId, cartItem.quantity + 1)} style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--color-primary)', border: 'none', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                          </div>
                        );
                      }
                      return (
                        <button className="product-card-add" onClick={(e) => handleQuickAdd(e, product)}>
                          +
                        </button>
                      );
                    })()}
                  </div>
                </div>

                {product.isAvailable === false && (
                  <div className="product-card-unavailable">{t('unavailable', language)}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && filteredProducts.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">{t('no_products', language)}</div>
        </div>
      )}

      {/* Product Bottom Sheet */}
      {selectedProduct && (
        <ProductSheet
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Story Viewer */}
      {storyViewer && (
        <div className="story-viewer" onClick={() => setStoryViewer(null)}>
          <img src={storyViewer.imageUrl} alt={storyViewer.title} />
          <div className="story-viewer-title">{storyViewer.title}</div>
          <button className="story-viewer-close" onClick={() => setStoryViewer(null)}>✕</button>
        </div>
      )}
    </div>
  );
}
