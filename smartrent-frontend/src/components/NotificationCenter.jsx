import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, CheckCheck, Circle, Trash2, Calendar, MessageSquare, 
  Shield, Sparkles, X, CheckCircle2 
} from 'lucide-react';
import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const socketRef = useRef(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  const fetchNotifications = async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const list = data.data?.notifications || data.notifications || [];
        setNotifications(list);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // ── Real-time Socket.io Notification Listener ──
    if (currentUser?._id) {
      try {
        const socket = io(SOCKET_URL, { autoConnect: true });
        socketRef.current = socket;

        socket.on('connect', () => {
          socket.emit('joinUser', currentUser._id);
        });

        socket.on('newNotification', (notif) => {
          setNotifications((prev) => [notif, ...prev]);
        });

        return () => {
          socket.disconnect();
        };
      } catch (err) {
        console.warn('Notification socket error:', err);
      }
    }

    // Fallback polling every 20 seconds
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  // ── Click Outside to Close Dropdown ──
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const markAllAsRead = async () => {
    if (!token) return;

    try {
      await fetch(`${API_BASE}/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const markSingleAsRead = async (id) => {
    if (!token) return;

    try {
      await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSingleNotification = async (e, id) => {
    e.stopPropagation();
    if (!token) return;

    try {
      await fetch(`${API_BASE}/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const clearAllNotifications = async () => {
    if (!token || !window.confirm('Clear all notifications?')) return;

    try {
      await fetch(`${API_BASE}/notifications`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications([]);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'booking':
        return <Calendar className="w-3.5 h-3.5 text-indigo-400" />;
      case 'message':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />;
      case 'system':
        return <Shield className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full transition flex items-center justify-center hover:opacity-80"
        style={{ color: 'var(--ink-soft)' }}
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className="absolute top-0 right-0 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-extrabold animate-pulse shadow-md"
            style={{ background: 'var(--danger, #ef4444)', color: '#ffffff' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl z-50 overflow-hidden border shadow-2xl animate-in fade-in slide-in-from-top-2"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: '0 16px 40px rgba(0,0,0,0.25)' }}
        >
          {/* Header */}
          <div
            className="p-3.5 border-b flex justify-between items-center"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-tint)' }}
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs" style={{ color: 'var(--ink)' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] font-bold flex items-center gap-1 hover:underline transition"
                  style={{ color: 'var(--brand)' }}
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Read all
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="text-[11px] font-medium text-slate-400 hover:text-rose-400 transition"
                  title="Clear all notifications"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y" style={{ borderColor: 'var(--border-soft)' }}>
            {notifications.length === 0 ? (
              <div className="py-12 px-6 text-center space-y-2">
                <Bell className="w-8 h-8 mx-auto opacity-30 text-slate-400" />
                <p className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>No notifications right now</p>
                <p className="text-[11px]" style={{ color: 'var(--ink-faint)' }}>
                  You'll be alerted here for bookings, approvals, and messages.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => !n.isRead && markSingleAsRead(n._id)}
                  className="p-3 text-xs transition cursor-pointer flex items-start gap-2.5 group relative hover:bg-slate-500/5"
                  style={{
                    background: !n.isRead ? 'var(--brand-soft)' : 'transparent',
                    color: 'var(--ink)'
                  }}
                >
                  {/* Type Icon */}
                  <div className="p-1.5 rounded-lg shrink-0 mt-0.5" style={{ background: 'var(--surface-tint)' }}>
                    {getTypeIcon(n.type)}
                  </div>

                  {/* Text & Timestamp */}
                  <div className="flex-1 overflow-hidden pr-6">
                    <p className={`leading-snug text-xs ${!n.isRead ? 'font-bold' : 'font-normal text-slate-300'}`}>
                      {n.message || n.text || n.title}
                    </p>
                    <span className="text-[10px] block mt-1 font-medium" style={{ color: 'var(--ink-faint)' }}>
                      {formatTime(n.createdAt)}
                    </span>
                  </div>

                  {/* Actions: Delete notification */}
                  <button
                    onClick={(e) => deleteSingleNotification(e, n._id)}
                    className="absolute right-2 top-3 p-1 rounded text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition"
                    title="Delete notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Unread dot indicator */}
                  {!n.isRead && (
                    <Circle
                      className="w-2 h-2 absolute right-3 top-4 shrink-0 group-hover:hidden"
                      style={{ color: 'var(--brand)', fill: 'var(--brand)' }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
