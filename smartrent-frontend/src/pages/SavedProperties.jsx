import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, MapPin, Trash2, Bed, Bath, ArrowRight, Building, Loader2, Sparkles } from 'lucide-react';
import { getStoredToken } from '../utils/authStorage';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const SavedProperties = () => {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  const fetchSaved = async () => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/saved-properties`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data?.saved) {
        setSaved(data.data.saved.filter(item => item.property != null));
      }
    } catch (err) {
      console.error('Error fetching saved properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  const handleRemove = async (propertyId) => {
    if (!propertyId) return;
    setRemovingId(propertyId);
    const token = getStoredToken();
    try {
      const res = await fetch(`${API_BASE}/saved-properties/${propertyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSaved((prev) => prev.filter((item) => item.property?._id !== propertyId));
      }
    } catch (err) {
      console.error('Error removing saved property:', err);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl" style={{ background: 'var(--brand-soft)' }}>
            <Bookmark className="w-6 h-6" style={{ color: 'var(--brand)' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
                Saved properties
              </h1>
              {!loading && saved.length > 0 && (
                <span className="badge badge-brand text-xs font-bold px-2 py-0.5">
                  {saved.length} saved
                </span>
              )}
            </div>
            <p className="text-xs" style={{ color: 'var(--ink-soft)' }}>
              Shortlisted homes and apartments saved to your personal collection
            </p>
          </div>
        </div>

        <Link to="/properties" className="btn btn-secondary btn-sm flex items-center gap-1.5">
          Browse listings <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3" style={{ color: 'var(--ink-soft)' }}>
          <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--brand)' }} />
          <p className="text-sm">Loading your saved properties…</p>
        </div>
      ) : saved.length === 0 ? (
        <div className="surface p-12 text-center space-y-4 rounded-2xl border" style={{ borderColor: 'var(--border)' }}>
          <div
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: 'var(--surface-tint)', color: 'var(--ink-faint)' }}
          >
            <Bookmark className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
              No saved properties yet
            </h2>
            <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--ink-soft)' }}>
              When exploring rental listings, click the bookmark icon on any property card to save it here for quick access later.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/properties" className="btn btn-primary btn-sm inline-flex items-center gap-1.5">
              Explore available properties <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {saved.map((item) => {
            const p = item.property;
            if (!p) return null;
            const isRemoving = removingId === p._id;

            return (
              <div
                key={item._id || p._id}
                className="tag-card flex flex-col justify-between group overflow-hidden transition hover:border-[var(--brand)]"
              >
                <span className="tag-card-corner" />

                {/* Property Image & Thumbnail */}
                <div className="relative h-48 overflow-hidden" style={{ background: 'var(--surface-tint)' }}>
                  {p.images && p.images[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.title || 'Property'}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--ink-faint)' }}>
                      <Building className="w-10 h-10 stroke-1" />
                    </div>
                  )}

                  {/* Property Type Badge */}
                  {p.propertyType && (
                    <span
                      className="absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide"
                      style={{ background: 'rgba(0,0,0,0.65)', color: '#fff', backdropFilter: 'blur(4px)' }}
                    >
                      {p.propertyType}
                    </span>
                  )}

                  {/* Remove Button on Image */}
                  <button
                    disabled={isRemoving}
                    onClick={() => handleRemove(p._id)}
                    className="absolute top-3 right-3 p-1.5 rounded-full transition bg-black/60 hover:bg-rose-600 text-white backdrop-blur-sm disabled:opacity-50"
                    title="Remove from saved"
                    aria-label="Remove from saved"
                  >
                    {isRemoving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>

                {/* Card Details */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/properties/${p._id}`}
                        className="font-semibold text-base hover:opacity-80 transition line-clamp-1"
                        style={{ color: 'var(--ink)' }}
                      >
                        {p.title}
                      </Link>
                    </div>

                    <p className="font-extrabold text-base" style={{ color: 'var(--brand)' }}>
                      PKR {p.price?.toLocaleString()}<span className="text-xs font-normal text-slate-400">/mo</span>
                    </p>

                    <p className="flex items-center text-xs truncate" style={{ color: 'var(--ink-soft)' }}>
                      <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" style={{ color: 'var(--ink-faint)' }} />
                      <span className="truncate">{p.location || 'Location unavailable'}</span>
                    </p>

                    {p.description && (
                      <p className="text-xs line-clamp-2 pt-1" style={{ color: 'var(--ink-faint)' }}>
                        {p.description}
                      </p>
                    )}
                  </div>

                  {/* Features & Action */}
                  <div className="space-y-3 pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                    <div className="flex items-center gap-4 text-xs font-medium" style={{ color: 'var(--ink-soft)' }}>
                      <span className="flex items-center">
                        <Bed className="w-3.5 h-3.5 mr-1" /> {p.bedrooms || 1} bed{p.bedrooms > 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center">
                        <Bath className="w-3.5 h-3.5 mr-1" /> {p.bathrooms || 1} bath{p.bathrooms > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        to={`/properties/${p._id}`}
                        className="btn btn-secondary btn-sm flex-1 justify-center"
                      >
                        View details
                      </Link>
                      <button
                        disabled={isRemoving}
                        onClick={() => handleRemove(p._id)}
                        className="btn btn-danger btn-sm px-2.5"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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

export default SavedProperties;
