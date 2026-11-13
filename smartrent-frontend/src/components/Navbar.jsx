import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Bookmark, Calendar, MessageSquare, LogOut, PlusSquare, LayoutDashboard, Menu, X } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import ThemeToggle from './ThemeToggle';
import { getStoredToken, getStoredUser, clearStoredAuth } from '../utils/authStorage';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const token = getStoredToken();
  const user = getStoredUser();

  const handleLogout = () => {
    clearStoredAuth();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const getDesktopLinkClass = (path) => {
    const active = isActive(path);
    return active
      ? 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-semibold text-xs sm:text-sm transition'
      : 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-transparent font-medium text-xs sm:text-sm transition hover:opacity-80';
  };

  const getDesktopLinkStyle = (path) => {
    const active = isActive(path);
    return active
      ? { color: 'var(--brand-strong)', background: 'var(--brand-soft)', borderColor: 'var(--border)' }
      : { color: 'var(--ink)' };
  };

  const getMobileLinkClass = (path) => {
    const active = isActive(path);
    return active
      ? 'block px-3 py-2 rounded-xl font-semibold border transition'
      : 'block px-3 py-2 rounded-xl font-medium transition hover:opacity-80';
  };

  const getMobileLinkStyle = (path) => {
    const active = isActive(path);
    return active
      ? { color: 'var(--brand-strong)', background: 'var(--brand-soft)', borderColor: 'var(--border)' }
      : { color: 'var(--ink)' };
  };

  return (
    <nav
      className="sticky top-0 z-40 w-full border-b"
      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6 py-3.5 flex justify-between items-center">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group" onClick={() => setMobileOpen(false)}>
          <span
            className="w-9 h-9 rounded-lg flex items-center justify-center font-display font-bold text-base"
            style={{ background: 'var(--brand)', color: 'var(--brand-ink)' }}
          >
            S
          </span>
          <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
            SmartRent<span style={{ color: 'var(--brand)' }}>.AI</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden lg:flex items-center gap-2 text-sm font-medium">
          <Link
            to="/"
            className={getDesktopLinkClass('/')}
            style={getDesktopLinkStyle('/')}
          >
            Home
          </Link>
          <Link
            to="/properties"
            className={getDesktopLinkClass('/properties')}
            style={getDesktopLinkStyle('/properties')}
          >
            Properties
          </Link>

          {token && (
            <>
              <Link
                to="/recommendations"
                className={getDesktopLinkClass('/recommendations')}
                style={getDesktopLinkStyle('/recommendations')}
              >
                <Sparkles className="w-3.5 h-3.5" /> AI matches
              </Link>
              <Link
                to="/saved"
                className={getDesktopLinkClass('/saved')}
                style={getDesktopLinkStyle('/saved')}
              >
                <Bookmark className="w-3.5 h-3.5" /> Saved
              </Link>
              <Link
                to="/bookings"
                className={getDesktopLinkClass('/bookings')}
                style={getDesktopLinkStyle('/bookings')}
              >
                <Calendar className="w-3.5 h-3.5" /> Bookings
              </Link>
              <Link
                to="/messages"
                className={getDesktopLinkClass('/messages')}
                style={getDesktopLinkStyle('/messages')}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Messages
              </Link>
            </>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <ThemeToggle className="hidden sm:inline-flex" />

          {token ? (
            <>
              {(user.role === 'owner' || user.role === 'admin') && (
                <Link to="/add-property" className="btn btn-primary btn-sm hidden sm:inline-flex">
                  <PlusSquare className="w-4 h-4" /> List property
                </Link>
              )}

              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition ${
                    isActive('/admin')
                      ? 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                      : 'border-transparent text-rose-400 hover:bg-rose-500/10'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" /> Admin
                </Link>
              )}

              <NotificationCenter />

              <Link to="/profile" className="flex items-center" title="Profile">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition ${
                    isActive('/profile')
                      ? 'border-[var(--brand)] ring-2 ring-[var(--brand)]/30'
                      : 'border-[var(--border)]'
                  }`}
                  style={{ background: 'var(--surface-tint)', color: 'var(--brand)' }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                </span>
              </Link>

              <button onClick={handleLogout} title="Log out" className="btn-ghost p-1.5 rounded-lg hidden sm:inline-flex">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login" className="btn btn-secondary btn-sm">Sign in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get started</Link>
            </div>
          )}

          <button
            className="lg:hidden btn-ghost p-1.5 rounded-lg"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t px-5 py-4 space-y-2 text-sm font-medium" style={{ borderColor: 'var(--border)' }}>
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className={getMobileLinkClass('/')}
            style={getMobileLinkStyle('/')}
          >
            Home
          </Link>
          <Link
            to="/properties"
            onClick={() => setMobileOpen(false)}
            className={getMobileLinkClass('/properties')}
            style={getMobileLinkStyle('/properties')}
          >
            Properties
          </Link>
          {token ? (
            <>
              <Link
                to="/recommendations"
                onClick={() => setMobileOpen(false)}
                className={getMobileLinkClass('/recommendations')}
                style={getMobileLinkStyle('/recommendations')}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> AI matches
                </span>
              </Link>
              <Link
                to="/saved"
                onClick={() => setMobileOpen(false)}
                className={getMobileLinkClass('/saved')}
                style={getMobileLinkStyle('/saved')}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5" /> Saved
                </span>
              </Link>
              <Link
                to="/bookings"
                onClick={() => setMobileOpen(false)}
                className={getMobileLinkClass('/bookings')}
                style={getMobileLinkStyle('/bookings')}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Bookings
                </span>
              </Link>
              <Link
                to="/messages"
                onClick={() => setMobileOpen(false)}
                className={getMobileLinkClass('/messages')}
                style={getMobileLinkStyle('/messages')}
              >
                <span className="inline-flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Messages
                </span>
              </Link>
              {(user.role === 'owner' || user.role === 'admin') && (
                <Link
                  to="/add-property"
                  onClick={() => setMobileOpen(false)}
                  className={getMobileLinkClass('/add-property')}
                  style={getMobileLinkStyle('/add-property')}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <PlusSquare className="w-3.5 h-3.5" /> List property
                  </span>
                </Link>
              )}
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 rounded-xl font-medium"
                  style={{ color: 'var(--danger)' }}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <LayoutDashboard className="w-3.5 h-3.5" /> Admin
                  </span>
                </Link>
              )}
              <div className="flex items-center justify-between pt-3 mt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <ThemeToggle />
                <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                  <LogOut className="w-4 h-4" /> Log out
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between pt-3 mt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <ThemeToggle />
              <div className="flex gap-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn btn-secondary btn-sm">Sign in</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="btn btn-primary btn-sm">Get started</Link>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
