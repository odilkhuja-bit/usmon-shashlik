// ============================================
// USMON SHASHLIK — Admin Login Page
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast('Iltimos, login va parolni kiriting', 'error');
      return;
    }

    try {
      setLoading(true);
      await login(username, password);
      showToast('Tizimga muvaffaqiyatli kirdingiz!', 'success');
      navigate('/');
    } catch (err) {
      showToast(err.message || 'Login yoki parol noto\'g\'ri', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">🍢</div>
          <h1 className="login-title">USMON SHASHLIK</h1>
          <p className="login-subtitle">Boshqaruv tizimiga kirish</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Login / Foydalanuvchi nomi</label>
            <input
              type="text"
              className="form-control"
              placeholder="Masalan: admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Parol</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Kirilmoqda...' : 'Tizimga kirish →'}
          </button>

        </form>
      </div>
    </div>
  );
}
