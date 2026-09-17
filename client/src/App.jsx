// ============================================
// USMON SHASHLIK — Main Client App
// ============================================

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import Favorites from './pages/Favorites';
import BranchSelect from './pages/BranchSelect';
import Onboarding from './pages/Onboarding';
import { initTelegramApp } from './utils/telegram';

function NavigationGuard({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedBranch, loading } = useApp();

  useEffect(() => {
    if (loading) return;

    const onboarded = localStorage.getItem('usmon_onboarded');
    if (!onboarded && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true });
      return;
    }

    // If onboarded but no branch selected and not on branch-select or onboarding
    if (onboarded && !selectedBranch && location.pathname !== '/branch-select' && location.pathname !== '/onboarding') {
      navigate('/branch-select', { replace: true });
    }
  }, [loading, selectedBranch, location.pathname, navigate]);

  return children;
}

function MainLayout() {
  return (
    <NavigationGuard>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/branch-select" element={<BranchSelect />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="*" element={<Home />} />
        </Routes>
        <BottomNav />
      </div>
    </NavigationGuard>
  );
}

export default function App() {
  useEffect(() => {
    initTelegramApp();
  }, []);

  return (
    <BrowserRouter>
      <AppProvider>
        <CartProvider>
          <ToastProvider>
            <MainLayout />
          </ToastProvider>
        </CartProvider>
      </AppProvider>
    </BrowserRouter>
  );
}
