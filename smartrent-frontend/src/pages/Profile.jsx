import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Pencil, Trash2, ExternalLink, PlusSquare, Building, MapPin, Loader2 } from 'lucide-react';
import { getStoredUser, getStoredToken } from '../utils/authStorage';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const Profile = () => {
  const location = useLocation();
  const [user, setUser] = useState({});
  const [myListings, setMyListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [preferences, setPreferences] = useState({
    preferredLocation: '',
    preferredType: 'Apartment',
    maxBudget: 0,
    bedrooms: 1
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const localUser = getStoredUser();
    setUser(localUser);
    if (localUser.preferences) {
      setPreferences(localUser.preferences);
    }

    if (localUser._id && (localUser.role === 'owner' || localUser.role === 'admin')) {
      fetchMyListings(localUser._id);
    }
  }, [location.key]);

  const fetchMyListings = async (userId) => {
    setLoadingListings(true);
    try {
      const res = await fetch(`${API_BASE}/properties?owner=${userId}&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      const data = await res.json();
      if (data.success) {
        setMyListings(data.data?.properties || data.properties || []);
      }
    } catch (err) {
      console.error('Failed to load user listings:', err);
    } finally {
      setLoadingListings(false);
    }
  };

  const handleDeleteListing = async (propId, propTitle) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${propTitle}"?`)) {
      return;
    }
    setDeletingId(propId);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/properties/${propId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMyListings(prev => prev.filter(p => p._id !== propId));
      } else {
        alert(data.message || 'Failed to delete listing');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting listing');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ preferences })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.data.user));
        setUser(data.data.user);
        setMessage('Preferences updated successfully!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isOwnerOrAdmin = user.role === 'owner' || user.role === 'admin';

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Account Info */}
      <div className="surface p-6 sm:p-8">
        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>User profile</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mb-6">
          <div>
            <span className="block text-xs" style={{ color: 'var(--ink-faint)' }}>Full name</span>
            <span className="font-semibold" style={{ color: 'var(--ink)' }}>{user.name}</span>
          </div>
          <div>
            <span className="block text-xs" style={{ color: 'var(--ink-faint)' }}>Email address</span>
            <span className="font-semibold" style={{ color: 'var(--ink)' }}>{user.email}</span>
          </div>
          <div>
            <span className="block text-xs" style={{ color: 'var(--ink-faint)' }}>Role</span>
            <span className="font-semibold uppercase" style={{ color: 'var(--brand)' }}>{user.role}</span>
          </div>
        </div>

        <hr className="my-6" style={{ borderColor: 'var(--border-soft)' }} />

        <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>AI search preferences</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--ink-soft)' }}>
          Updating your preferences tunes the recommendation engine for your profile.
        </p>

        {message && <p className="mb-4 text-xs p-2 rounded badge-success" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>{message}</p>}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="field-label">Preferred location</label>
            <input
              type="text"
              value={preferences.preferredLocation}
              onChange={(e) => setPreferences({ ...preferences, preferredLocation: e.target.value })}
              className="input"
              placeholder="e.g. Gulberg, Lahore"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="field-label">Property type</label>
              <select
                value={preferences.preferredType}
                onChange={(e) => setPreferences({ ...preferences, preferredType: e.target.value })}
                className="input"
              >
                <option value="Apartment">Apartment</option>
                <option value="House">House</option>
                <option value="Villa">Villa</option>
                <option value="Studio">Studio</option>
              </select>
            </div>

            <div>
              <label className="field-label">Max budget (PKR)</label>
              <input
                type="number"
                value={preferences.maxBudget}
                onChange={(e) => setPreferences({ ...preferences, maxBudget: Number(e.target.value) })}
                className="input"
              />
            </div>

            <div>
              <label className="field-label">Bedrooms</label>
              <input
                type="number"
                min="1"
                value={preferences.bedrooms}
                onChange={(e) => setPreferences({ ...preferences, bedrooms: Number(e.target.value) })}
                className="input"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary">
            Save AI preferences
          </button>
        </form>
      </div>

      {/* MY PUBLISHED LISTINGS (Owner & Admin) */}
      {isOwnerOrAdmin && (
        <div className="surface p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b" style={{ borderColor: 'var(--border-soft)' }}>
            <div>
              <h3 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
                My Published Listings
              </h3>
              <p className="text-xs" style={{ color: 'var(--ink-soft)' }}>
                Manage, update, edit pricing, or remove your published properties
              </p>
            </div>
            <Link to="/add-property" className="btn btn-primary btn-sm self-start sm:self-auto flex items-center gap-1.5">
              <PlusSquare className="w-4 h-4" /> List new property
            </Link>
          </div>

          {loadingListings ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2" style={{ color: 'var(--ink-soft)' }}>
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--brand)' }} />
              <p className="text-xs">Loading your listings…</p>
            </div>
          ) : myListings.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Building className="w-10 h-10 mx-auto stroke-1" style={{ color: 'var(--ink-faint)' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                You haven't published any property listings yet
              </p>
              <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--ink-soft)' }}>
                Publish your rental property with AI market rent prediction and reach active renters.
              </p>
              <div className="pt-2">
                <Link to="/add-property" className="btn btn-primary btn-sm">
                  Publish your first listing
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {myListings.map((prop) => {
                const isDeleting = deletingId === prop._id;
                return (
                  <div
                    key={prop._id}
                    className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition"
                    style={{ borderColor: 'var(--border-soft)', background: 'var(--surface)' }}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border" style={{ borderColor: 'var(--border)', background: 'var(--surface-tint)' }}>
                        {prop.images && prop.images[0] ? (
                          <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--ink-faint)' }}>
                            <Building className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm truncate" style={{ color: 'var(--ink)' }}>
                            {prop.title}
                          </h4>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                            prop.status === 'Rented' ? 'bg-slate-500/10 text-slate-400' : 'bg-emerald-500/10 text-emerald-500'
                          }`}>
                            {prop.status || 'Available'}
                          </span>
                        </div>
                        <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--ink-soft)' }}>
                          <MapPin className="w-3 h-3 shrink-0" style={{ color: 'var(--ink-faint)' }} />
                          <span className="truncate">{prop.location}</span>
                        </p>
                        <p className="text-xs font-bold mt-1" style={{ color: 'var(--brand)' }}>
                          PKR {prop.price?.toLocaleString()}/mo
                          <span className="text-[10px] font-normal ml-2" style={{ color: 'var(--ink-faint)' }}>
                            {prop.bedrooms} Bed · {prop.bathrooms} Bath · {prop.propertyType}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <Link
                        to={`/properties/${prop._id}`}
                        className="btn btn-ghost btn-sm px-2.5 py-1.5 text-xs flex items-center gap-1"
                        title="View live property page"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View
                      </Link>

                      <Link
                        to={`/edit-property/${prop._id}`}
                        className="btn btn-secondary btn-sm px-3 py-1.5 text-xs flex items-center gap-1"
                        title="Edit listing details, price, or images"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </Link>

                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleDeleteListing(prop._id, prop.title)}
                        className="btn btn-danger btn-sm px-2.5 py-1.5 text-xs flex items-center gap-1"
                        title="Delete listing"
                      >
                        {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;

