import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Trash2, Loader2, CheckCircle, XCircle, Clock, Building, ArrowRight } from 'lucide-react';
import { getStoredUser, getStoredToken } from '../utils/authStorage';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const user = getStoredUser();
  const isOwner = user.role === 'owner';

  const fetchBookings = async () => {
    const token = getStoredToken();
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBookings(data.data?.bookings || data.bookings || []);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    const token = localStorage.getItem('token');
    setActionLoading(`status-${id}`);
    try {
      const res = await fetch(`${API_BASE}/bookings/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, status } : b)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel and delete this booking?')) return;
    const token = localStorage.getItem('token');
    setActionLoading(`del-${id}`);
    try {
      const res = await fetch(`${API_BASE}/bookings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBookings((prev) => prev.filter((b) => b._id !== id));
      } else {
        alert(data.message || 'Failed to delete booking');
      }
    } catch (err) {
      console.error('Delete booking error:', err);
      alert('Error deleting booking');
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = (status) => {
    if (status === 'approved') return 'badge-success';
    if (status === 'rejected') return 'badge-danger';
    return 'badge-gold';
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    return (
      d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) +
      ' at ' +
      d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    );
  };

  const formatDateRange = (startStr, endStr) => {
    if (!startStr && !endStr) return 'Dates not specified';
    const s = startStr ? new Date(startStr) : null;
    const e = endStr ? new Date(endStr) : null;
    const sValid = s && !isNaN(s.getTime());
    const eValid = e && !isNaN(e.getTime());
    const opts = { month: 'short', day: 'numeric', year: 'numeric' };

    if (sValid && eValid) {
      return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', opts)}`;
    }
    if (sValid) return `From ${s.toLocaleDateString('en-US', opts)}`;
    if (eValid) return `Until ${e.toLocaleDateString('en-US', opts)}`;
    return 'N/A';
  };

  const getDurationText = (startStr, endStr) => {
    if (!startStr || !endStr) return null;
    const s = new Date(startStr);
    const e = new Date(endStr);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
    const diffDays = Math.round((e - s) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return null;
    if (diffDays >= 30) {
      const months = Math.round(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    }
    return `${diffDays} days`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl" style={{ background: 'var(--brand-soft)' }}>
            <Calendar className="w-6 h-6" style={{ color: 'var(--brand)' }} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
              {isOwner ? 'Received property bookings' : 'My rental bookings'}
            </h1>
            <p className="text-xs" style={{ color: 'var(--ink-soft)' }}>
              {isOwner ? 'Review and manage rental requests for your properties' : 'Track your rental dates, move-in periods, and status'}
            </p>
          </div>
        </div>

        <Link to="/properties" className="btn btn-secondary btn-sm flex items-center gap-1.5">
          Browse more <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3" style={{ color: 'var(--ink-soft)' }}>
          <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--brand)' }} />
          <p className="text-sm">Loading bookings…</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="surface p-12 text-center space-y-3">
          <Calendar className="w-10 h-10 mx-auto stroke-1" style={{ color: 'var(--ink-faint)' }} />
          <p className="text-base font-semibold" style={{ color: 'var(--ink)' }}>
            No bookings found
          </p>
          <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--ink-soft)' }}>
            {isOwner
              ? 'When renters request to book your properties, their requests will appear here.'
              : 'You have not submitted any property booking requests yet.'}
          </p>
          <div className="pt-2">
            <Link to="/properties" className="btn btn-primary btn-sm">
              Explore available properties
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const isDeleting = actionLoading === `del-${b._id}`;
            const isUpdating = actionLoading === `status-${b._id}`;
            const duration = getDurationText(b.startDate, b.endDate);

            return (
              <div
                key={b._id}
                className="surface p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-5 transition hover:border-[var(--brand)]"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="flex items-start gap-4 min-w-0">
                  {/* Property Thumbnail */}
                  <div
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border"
                    style={{ borderColor: 'var(--border-soft)', background: 'var(--surface-tint)' }}
                  >
                    {b.property?.images && b.property.images[0] ? (
                      <img
                        src={b.property.images[0]}
                        alt={b.property.title || 'Property'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--ink-faint)' }}>
                        <Building className="w-7 h-7" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        to={b.property?._id ? `/properties/${b.property._id}` : '#'}
                        className="font-semibold text-base hover:opacity-80 transition line-clamp-1"
                        style={{ color: 'var(--ink)' }}
                      >
                        {b.property?.title || 'Unknown Property'}
                      </Link>
                    </div>

                    <p className="flex items-center text-xs" style={{ color: 'var(--ink-soft)' }}>
                      <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" style={{ color: 'var(--ink-faint)' }} />
                      <span className="truncate">{b.property?.location || 'Location unavailable'}</span>
                    </p>

                    {/* RENTAL PERIOD (START DATE – END DATE) */}
                    <div className="flex items-center gap-1.5 text-xs font-medium pt-0.5" style={{ color: 'var(--ink)' }}>
                      <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--brand)' }} />
                      <span className="flex items-center flex-wrap gap-1">
                        <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--ink-faint)' }}>
                          Rental Period:
                        </span>
                        <span className="font-semibold">{formatDateRange(b.startDate, b.endDate)}</span>
                        {duration && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded" style={{ background: 'var(--surface-tint)', color: 'var(--brand)' }}>
                            {duration}
                          </span>
                        )}
                      </span>
                    </div>

                    {/* BOOKING TIMESTAMP (DATE & TIME) */}
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--ink-soft)' }}>
                      <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--ink-faint)' }} />
                      <span>
                        <span className="font-semibold text-[11px] uppercase tracking-wide" style={{ color: 'var(--ink-faint)' }}>
                          Booked on:{' '}
                        </span>
                        <span className="font-medium">{formatDateTime(b.createdAt)}</span>
                      </span>
                    </div>

                    {/* Renter information (for owner) */}
                    {isOwner && b.renter && (
                      <p className="text-xs pt-1 border-t" style={{ borderColor: 'var(--border-soft)', color: 'var(--ink-soft)' }}>
                        <span className="font-semibold" style={{ color: 'var(--ink-faint)' }}>Renter: </span>
                        <span className="font-medium" style={{ color: 'var(--ink)' }}>{b.renter.name}</span>
                        <span className="ml-1 text-[11px]" style={{ color: 'var(--ink-faint)' }}>({b.renter.email})</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Side: Total Rent, Status Badge & Actions */}
                <div
                  className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0"
                  style={{ borderColor: 'var(--border-soft)' }}
                >
                  <div className="text-left md:text-right">
                    <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: 'var(--ink-faint)' }}>
                      Total Amount
                    </span>
                    <p className="text-lg font-bold" style={{ color: 'var(--brand)' }}>
                      {b.totalPrice ? `${b.totalPrice.toLocaleString()} PKR` : 'N/A'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`badge ${statusBadge(b.status)} uppercase font-bold text-[10px] flex items-center gap-1`}>
                      {b.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                      {b.status === 'rejected' && <XCircle className="w-3 h-3" />}
                      {b.status === 'pending' && <Clock className="w-3 h-3" />}
                      {b.status}
                    </span>

                    {/* Owner Approval/Rejection actions */}
                    {isOwner && b.status === 'pending' && (
                      <div className="flex gap-1.5">
                        <button
                          disabled={isUpdating}
                          onClick={() => handleStatusUpdate(b._id, 'approved')}
                          className="btn btn-primary btn-sm px-2.5 py-1 text-xs"
                        >
                          Approve
                        </button>
                        <button
                          disabled={isUpdating}
                          onClick={() => handleStatusUpdate(b._id, 'rejected')}
                          className="btn btn-danger btn-sm px-2.5 py-1 text-xs"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {/* Cancel / Delete Booking Button */}
                    <button
                      disabled={isDeleting}
                      onClick={() => handleDeleteBooking(b._id)}
                      className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition border border-transparent hover:border-rose-500/30 disabled:opacity-50"
                      title="Cancel and delete this booking"
                    >
                      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Bookings;
