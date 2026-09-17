// ============================================
// USMON SHASHLIK — Cart Context
// ============================================

import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('usmon_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save cart to localStorage on every change
  const saveCart = useCallback((newItems) => {
    setItems(newItems);
    localStorage.setItem('usmon_cart', JSON.stringify(newItems));
  }, []);

  const addItem = useCallback((product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      let newItems;
      if (existing) {
        newItems = prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newItems = [
          ...prev,
          {
            productId: product.id,
            name: product.nameUz,
            nameRu: product.nameRu,
            price: product.price,
            imageUrl: product.imageUrl,
            quantity,
          },
        ];
      }
      localStorage.setItem('usmon_cart', JSON.stringify(newItems));
      return newItems;
    });
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    setItems((prev) => {
      let newItems;
      if (quantity <= 0) {
        newItems = prev.filter((item) => item.productId !== productId);
      } else {
        newItems = prev.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        );
      }
      localStorage.setItem('usmon_cart', JSON.stringify(newItems));
      return newItems;
    });
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((prev) => {
      const newItems = prev.filter((item) => item.productId !== productId);
      localStorage.setItem('usmon_cart', JSON.stringify(newItems));
      return newItems;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem('usmon_cart');
  }, []);

  const getItemQuantity = useCallback(
    (productId) => {
      const item = items.find((i) => i.productId === productId);
      return item ? item.quantity : 0;
    },
    [items]
  );

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const value = {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getItemQuantity,
    totalItems,
    subtotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
