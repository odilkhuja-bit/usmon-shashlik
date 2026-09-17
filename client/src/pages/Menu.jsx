// ============================================
// USMON SHASHLIK — Menu Page
// ============================================

import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { clientAPI } from '../services/api';
import { t, getProductName, getCategoryName } from '../utils/i18n';
import { formatPrice, calcDiscount } from '../utils/helpers';
import { haptic } from '../utils/telegram';
import ProductSheet from '../components/ProductSheet';

export default function Menu() {
  const { language, categories } = useApp();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await clientAPI.getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    let result = products;
    if (selectedCategory) {
      result = result.filter((p) => p.categoryId === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.nameUz.toLowerCase().includes(q) || p.nameRu.toLowerCase().includes(q)
      );
    }
    return result;
  }, [products, selectedCategory, search]);

  const handleQuickAdd = (e, product) => {
    e.stopPropagation();
    if (!product.isAvailable) return;
    addItem(product, 1);
    haptic('light');
    showToast(t('added_to_cart', language));
  };

  return (
    <div>
      <div className="page" style={{ paddingTop: '16px' }}>
        <h1 className="page-title">🍢 {language === 'ru' ? 'Меню' : 'Menyu'}</h1>
      </div>

      {/* Search */}
      <div className="search-bar">
        <input
          className="search-input"
          placeholder={t('search_placeholder', language)}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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

      {/* Products */}
      {loading ? (
        <div className="products-grid">
          {[1,2,3,4,5,6].map((i) => (
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
              <div key={product.id} className="product-card" onClick={() => setSelectedProduct(product)}>
                {discount > 0 && <span className="product-card-discount">-{discount}%</span>}

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
                      {product.oldPrice && <span className="product-card-old-price">{formatPrice(product.oldPrice)}</span>}
                    </div>
                    {product.isAvailable !== false && (
                      <button className="product-card-add" onClick={(e) => handleQuickAdd(e, product)}>+</button>
                    )}
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

      {selectedProduct && (
        <ProductSheet product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}
