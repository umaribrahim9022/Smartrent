import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Sparkles, CheckCircle, AlertCircle, MapPin, Bed, Bath, ArrowLeft, 
  MessageCircle, Pencil, Trash2, Calendar, Clock, X, Loader2 
} from 'lucide-react';
import PropertyAnalyticsBadge from '../components/PropertyAnalyticsBadge';
import BookmarkButton from '../components/BookmarkButton';

const PropertyFairRentBadge = ({ property }) => {
  const [estimatedRent, setEstimatedRent] = useState(null);

  useEffect(() => {
    if (!property?.location) return;

    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    fetch(`${API_BASE}/rent-prediction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: property.location,
        bedrooms: property.bedrooms,
        propertyType: property.propertyType
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEstimatedRent(data.data.predictedRent);
        }
      })
      .catch((err) => console.error(err));
  }, [property]);

  if (!estimatedRent) return null;

  const diff = property.price - estimatedRent;
  const isFairDeal = diff <= 0;

  return (
    <div className="surface p-4 my-4 flex items-center justify-between flex-wrap gap-3" style={{ background: 'var(--brand-soft)', borderColor: 'var(--border)' }}>
      <div className="flex items-center space-x-3">
        <div className="p-2.5 rounded-lg" style={{ background: 'var(--brand)', color: 'var(--brand-ink)' }}>
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-bold" style={{ color: 'var(--brand-strong)' }}>AI market value evaluation</p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ink)' }}>
            Estimated fair rent: <span className="font-extrabold">PKR {estimatedRent.toLocaleString()}/mo</span>
          </p>
        </div>
      </div>

      

      <div>
        {isFairDeal ? (
          <span className="badge badge-success"><CheckCircle className="w-3.5 h-3.5" /> Fair / great deal</span>
        ) : (
          <span className="badge badge-gold"><AlertCircle className="w-3.5 h-3.5" /> Above market average</span>
        )}
      </div>
    </div>
  );
};

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messaging, setMessaging] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStart, setBookingStart] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [bookingEnd, setBookingEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !id) return;
    fetch(`${API_BASE}/saved-properties/ids`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.ids) {
          setIsSaved(data.data.ids.includes(id));
        }
      })
      .catch(err => console.error(err));
  }, [id, API_BASE]);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await fetch(`${API_BASE}/properties/${id}`);
        const data = await res.json();
        if (data.success) {
          setProperty(data.data.property);
        } else {
          setError('Property not found');
        }
      } catch (err) {
        setError('Failed to fetch property details');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, API_BASE]);

  const setDurationMonths = (months) => {
    const s = bookingStart ? new Date(bookingStart) : new Date();
    const e = new Date(s);
    e.setMonth(e.getMonth() + months);
    setBookingEnd(e.toISOString().split('T')[0]);
  };

  const calculateDays = () => {
    if (!bookingStart || !bookingEnd) return 0;
    const s = new Date(bookingStart);
    const e = new Date(bookingEnd);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
    return Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
  };

  const calculateTotal = () => {
    if (!property?.price) return 0;
    const days = calculateDays();
    if (days <= 0) return property.price;
    return Math.round((property.price / 30) * days);
  };

  const handleBook = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in as a renter to book properties');
      navigate('/login');
      return;
    }
    setBookingSuccess(false);
    setShowBookingModal(true);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in as a renter to book properties');
      navigate('/login');
      return;
    }

    const s = new Date(bookingStart);
    const eDate = new Date(bookingEnd);
    if (eDate <= s) {
      alert('Move-out date must be after move-in date');
      return;
    }

    setBookingSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          propertyId: property._id,
          startDate: s.toISOString(),
          endDate: eDate.toISOString(),
          totalPrice: calculateTotal()
        })
      });
      const data = await res.json();
      if (data.success) {
        setBookingSuccess(true);
      } else {
        alert(data.message || 'Failed to submit booking');
      }
    } catch (err) {
      alert('Error booking property');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleMessageOwner = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to message the owner');
      return;
    }
    if (!property?.owner?._id) {
      alert('Owner information is not available for this listing');
      return;
    }

    setMessaging(true);
    try {
      const res = await fetch(`${API_BASE}/messaging/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ landlordId: property.owner._id })
      });
      const data = await res.json();
      if (data.success) {
        const conversation = data.data?.conversation || data.conversation || data.data;
        navigate('/messages', { state: { openConversationId: conversation?._id } });
      } else {
        alert(data.message || 'Failed to start conversation');
      }
    } catch (err) {
      alert('Error starting conversation with owner');
    } finally {
      setMessaging(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete "${property.title}"?`)) {
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/properties/${property._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert('Listing deleted successfully');
        navigate('/properties');
      } else {
        alert(data.message || 'Failed to delete property');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting property');
    }
  };

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const ownerId = property?.owner?._id || property?.owner;
  const canManage = Boolean(currentUser?._id && (currentUser._id === ownerId || currentUser.role === 'admin'));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Sparkles className="w-8 h-8 animate-spin" style={{ color: 'var(--brand)' }} />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="text-center py-12">
        <p className="mb-4" style={{ color: 'var(--danger)' }}>{error || 'Property not found'}</p>
        <Link to="/properties" className="font-semibold" style={{ color: 'var(--brand)' }}>← Back to properties</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/properties" className="inline-flex items-center text-sm font-medium transition" style={{ color: 'var(--brand)' }}>
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to listings
      </Link>

      <div className="surface overflow-hidden">
        <div className="h-72 sm:h-96 w-full relative" style={{ background: 'var(--surface-tint)' }}>
          {property.images && property.images.length > 0 ? (
            <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-medium" style={{ color: 'var(--ink-faint)' }}>
              {property.propertyType} image
            </div>
          )}
          <BookmarkButton
            propertyId={property._id}
            isSaved={isSaved}
            onToggle={(_, s) => setIsSaved(s)}
            className="absolute top-4 left-4 z-10"
          />
          <div
            className="absolute top-4 right-4 backdrop-blur px-3 py-1.5 rounded-lg font-bold text-lg"
            style={{ background: 'var(--surface)', color: 'var(--brand)' }}
          >
            PKR {property.price?.toLocaleString()}/mo
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                  property.status === 'Rented' ? 'bg-slate-500/10 text-slate-400' : 'bg-emerald-500/10 text-emerald-500'
                }`}>
                  {property.status || 'Available'}
                </span>
                {canManage && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded border" style={{ borderColor: 'var(--border)', color: 'var(--brand)' }}>
                    Your Listing
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>{property.title}</h1>
              <p className="flex items-center" style={{ color: 'var(--ink-soft)' }}>
                <MapPin className="w-4 h-4 mr-1" style={{ color: 'var(--ink-faint)' }} />
                {property.location}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {canManage ? (
                <>
                  <Link
                    to={`/edit-property/${property._id}`}
                    className="btn btn-primary btn-lg flex-1 sm:flex-none flex items-center justify-center gap-1.5"
                  >
                    <Pencil className="w-4 h-4" /> Edit listing
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="btn btn-danger btn-lg flex-1 sm:flex-none flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <BookmarkButton
                    propertyId={property._id}
                    isSaved={isSaved}
                    onToggle={(_, s) => setIsSaved(s)}
                    buttonVariant="button"
                    className="h-11 px-4"
                  />
                  <button onClick={handleBook} className="btn btn-primary btn-lg flex-1 sm:flex-none">
                    Book now
                  </button>
                </div>
              )}
            </div>
          </div>

          {!canManage && property.owner && property.owner._id && (
            <button
              onClick={handleMessageOwner}
              disabled={messaging}
              className="btn btn-secondary btn-sm mb-4"
            >
              <MessageCircle className="w-4 h-4" /> {messaging ? 'Opening chat…' : 'Message owner'}
            </button>
          )}

          <PropertyAnalyticsBadge
            demand={property.demand}
            locationAnalytics={property.locationAnalytics}
            viewsCount={property.viewsCount}
          />

          <PropertyFairRentBadge property={property} />

          <div className="flex items-center gap-6 my-6 p-4 rounded-xl" style={{ background: 'var(--surface-tint)' }}>
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--ink-faint)' }}>Type</span>
              <span className="font-semibold" style={{ color: 'var(--ink)' }}>{property.propertyType}</span>
            </div>
            <div className="w-px h-8" style={{ background: 'var(--border)' }}></div>
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--ink-faint)' }}>Bedrooms</span>
              <span className="font-semibold flex items-center" style={{ color: 'var(--ink)' }}><Bed className="w-4 h-4 mr-1" /> {property.bedrooms}</span>
            </div>
            <div className="w-px h-8" style={{ background: 'var(--border)' }}></div>
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--ink-faint)' }}>Bathrooms</span>
              <span className="font-semibold flex items-center" style={{ color: 'var(--ink)' }}><Bath className="w-4 h-4 mr-1" /> {property.bathrooms}</span>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>Description</h2>
            <p className="leading-relaxed whitespace-pre-line" style={{ color: 'var(--ink-soft)' }}>
              {property.description}
            </p>
          </div>

          {property.owner && property.owner.name && (
            <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--border-soft)' }}>
              <h2 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--ink-faint)' }}>Listed by</h2>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                  style={{ background: 'var(--brand-soft)', color: 'var(--brand-strong)' }}
                >
                  {property.owner.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold" style={{ color: 'var(--ink)' }}>{property.owner.name}</p>
                  <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>Property owner</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking Date & Rental Period Selection Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="surface max-w-lg w-full rounded-2xl p-6 border shadow-2xl relative space-y-5"
            style={{ borderColor: 'var(--border)' }}
          >
            <button
              onClick={() => {
                setShowBookingModal(false);
                setBookingSuccess(false);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {bookingSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div
                  className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                  style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
                >
                  <CheckCircle className="w-9 h-9" />
                </div>
                <h3 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
                  Booking Request Sent!
                </h3>
                <p className="text-sm max-w-sm mx-auto" style={{ color: 'var(--ink-soft)' }}>
                  Your booking request for <strong className="text-[var(--ink)]">{property.title}</strong> has been submitted. The owner has been notified.
                </p>
                <div
                  className="p-4 rounded-xl text-left text-xs space-y-1.5"
                  style={{ background: 'var(--surface-tint)', borderColor: 'var(--border-soft)' }}
                >
                  <p className="flex justify-between">
                    <span style={{ color: 'var(--ink-faint)' }}>Rental Period:</span>
                    <span className="font-semibold" style={{ color: 'var(--ink)' }}>
                      {new Date(bookingStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} –{' '}
                      {new Date(bookingEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span style={{ color: 'var(--ink-faint)' }}>Duration:</span>
                    <span className="font-semibold" style={{ color: 'var(--ink)' }}>
                      {calculateDays()} days (~{Math.max(1, Math.round(calculateDays() / 30))} mo)
                    </span>
                  </p>
                  <p className="flex justify-between font-bold pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
                    <span style={{ color: 'var(--ink)' }}>Total Rent:</span>
                    <span style={{ color: 'var(--brand)' }}>{calculateTotal().toLocaleString()} PKR</span>
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowBookingModal(false);
                      setBookingSuccess(false);
                    }}
                    className="btn btn-secondary flex-1"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => navigate('/bookings')}
                    className="btn btn-primary flex-1"
                  >
                    Go to My Bookings
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-5 h-5" style={{ color: 'var(--brand)' }} />
                    <h3 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
                      Select Rental Dates
                    </h3>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--ink-soft)' }}>
                    Choose your move-in and lease end date for <strong className="text-[var(--ink)]">{property.title}</strong>.
                  </p>
                </div>

                {/* Duration Presets */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--ink-faint)' }}>
                    Quick Durations
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: '1 Month', months: 1 },
                      { label: '3 Months', months: 3 },
                      { label: '6 Months', months: 6 },
                      { label: '1 Year', months: 12 }
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setDurationMonths(p.months)}
                        className="py-1.5 text-xs rounded-lg border font-semibold hover:border-[var(--brand)] transition text-center"
                        style={{
                          background: 'var(--surface-tint)',
                          borderColor: 'var(--border)',
                          color: 'var(--ink)'
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--ink)' }}>
                      Move-in Date
                    </label>
                    <input
                      type="date"
                      required
                      value={bookingStart}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setBookingStart(e.target.value)}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--ink)' }}>
                      Move-out Date
                    </label>
                    <input
                      type="date"
                      required
                      value={bookingEnd}
                      min={bookingStart || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setBookingEnd(e.target.value)}
                      className="input w-full"
                    />
                  </div>
                </div>

                {/* Price Breakdown */}
                <div
                  className="p-3.5 rounded-xl text-xs space-y-1.5 border"
                  style={{ background: 'var(--surface-tint)', borderColor: 'var(--border)' }}
                >
                  <div className="flex justify-between" style={{ color: 'var(--ink-soft)' }}>
                    <span>Monthly Rate:</span>
                    <span className="font-semibold" style={{ color: 'var(--ink)' }}>PKR {property.price?.toLocaleString()}/mo</span>
                  </div>
                  <div className="flex justify-between" style={{ color: 'var(--ink-soft)' }}>
                    <span>Calculated Duration:</span>
                    <span className="font-semibold" style={{ color: 'var(--ink)' }}>{calculateDays()} days</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t font-bold text-sm" style={{ borderColor: 'var(--border)' }}>
                    <span style={{ color: 'var(--ink)' }}>Estimated Total Rent:</span>
                    <span className="text-base" style={{ color: 'var(--brand)' }}>
                      PKR {calculateTotal().toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingSubmitting || calculateDays() <= 0}
                    className="btn btn-primary flex-1 flex items-center justify-center gap-1.5"
                  >
                    {bookingSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
                      </>
                    ) : (
                      'Confirm Request'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetail;
