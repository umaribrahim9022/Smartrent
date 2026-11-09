import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/');
      } else {
        setError(data.message || 'Login failed.');
      }
    } catch (err) {
      setError('Server connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] w-full flex items-center justify-center px-4 py-14 relative">
      <div className="grain-glow w-[420px] h-[420px] top-1/4 left-1/2 -translate-x-1/2" />

      <div className="surface relative z-10 w-full max-w-sm p-8 space-y-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="p-3 rounded-xl" style={{ background: 'var(--brand-soft)' }}>
            <Building2 className="w-7 h-7" style={{ color: 'var(--brand)' }} />
          </div>
          <h1 className="text-2xl font-semibold mt-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>Welcome back</h1>
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>Sign in to pick up your matches.</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl text-xs font-medium text-center" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="field-label">Email address</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--ink-faint)' }} />
              <input
                type="email"
                required
                placeholder="jane@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input has-icon-left pl-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="field-label">Password</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--ink-faint)' }} />
              <input
                type={showPass ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input has-icon-both pl-10 pr-10"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center p-1 cursor-pointer" style={{ color: 'var(--ink-faint)' }} aria-label={showPass ? 'Hide password' : 'Show password'}>
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-block btn-lg">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm" style={{ color: 'var(--ink-soft)' }}>
          New to SmartRent?{' '}
          <Link to="/register" className="font-semibold" style={{ color: 'var(--brand)' }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
