import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { MapPin, Bed, Bath, SlidersHorizontal, RotateCcw, CheckCircle2 } from 'lucide-react';
import PropertyAnalyticsBadge from '../components/PropertyAnalyticsBadge';
import BookmarkButton from '../components/BookmarkButton';
import { getStoredToken } from '../utils/authStorage';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const Properties = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedIds, setSavedIds] = useState([]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    fetch(`${API_BASE}/saved-properties/ids?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache'
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.ids) setSavedIds(data.data.ids);
      })
      .catch(err => console.error(err));
  }, [location.key]);

  const handleBookmarkToggle = (id, isSaved) => {
    setSavedIds(prev => (isSaved ? [...prev, id] : prev.filter(x => x !== id)));
  };

  const [filterLoc, setFilterLoc] = useState(searchParams.get('location') || '');
  const [filterType, setFilterType] = useState(searchParams.get('type') || '');
  const [filterPrice, setFilterPrice] = useState(
    searchParams.get('maxPrice') || searchParams.get('budget') || ''
  );

  const fetchProperties = async (loc, type, price) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (loc && loc.trim()) params.set('location', loc.trim());
      if (type && type.trim()) params.set('type', type.trim());
      if (price) {
        const cleanPrice = String(price).replace(/[^0-9.]/g, '');
        if (cleanPrice) params.set('budget', cleanPrice);
      }
      params.set('_t', Date.now().toString());

      const url = `${API_BASE}/properties?${params.toString()}`;
      const request = async () => {
        const res = await fetch(url, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          signal: AbortSignal.timeout(20000)
        });
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed to load listings');
        return data.data?.properties || data.properties || [];
      };

      let list;
      try {
        list = await request();
      } catch (firstErr) {
        // Railway cold starts can drop the first request; retry once.
        await new Promise((resolve) => setTimeout(resolve, 800));
        list = await request();
      }
      setProperties(list);
    } catch (err) {
      console.error('Failed to fetch properties:', err);
      setProperties([]);
      setError(err?.message || 'Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loc = searchParams.get('location') || '';
    const type = searchParams.get('type') || '';
    const price = searchParams.get('maxPrice') || searchParams.get('budget') || '';

    setFilterLoc(loc);
    setFilterType(type);
    setFilterPrice(price);

    fetchProperties(loc, type, price);
  }, [searchParams, location.key]);

  const handleApply = (e) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (filterLoc.trim()) params.set('location', filterLoc.trim());
    if (filterType.trim()) params.set('type', filterType.trim());
    if (filterPrice) {
      const cleanPrice = String(filterPrice).replace(/[^0-9.]/g, '');
      if (cleanPrice) params.set('maxPrice', cleanPrice);
    }
    setSearchParams(params);
  };

  const handleClear = () => {
    setFilterLoc('');
    setFilterType('');
    setFilterPrice('');
    setSearchParams(new URLSearchParams());
  };

  const handleRetry = () => {
    fetchProperties(
      searchParams.get('location') || '',
      searchParams.get('type') || '',
      searchParams.get('maxPrice') || searchParams.get('budget') || ''
    );
  };

  const handleBook = async (propertyId, price) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in as a renter to book properties');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          propertyId,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          totalPrice: price
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Booking request submitted successfully!');
      } else {
        alert(data.message || 'Failed to submit booking');
      }
    } catch (err) {
      console.error(err);
      alert('Error booking property');
    }
  };

  const hasActiveFilters = Boolean(filterLoc || filterType || filterPrice);

  return (
    <div className="max-w-7xl mx-auto px-1 sm:px-2 py-2">
      {location.state?.message && (
        <div className="mb-5 p-3.5 rounded-xl flex items-center gap-2 text-sm font-semibold" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{location.state.message}</span>
        </div>
      )}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
            Browse properties
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-soft)' }}>
            {loading ? 'Searching listings…' : error ? 'Listings could not be loaded' : `${properties.length} listings available`}
            {hasActiveFilters && !loading && ' (filtered)'}
          </p>
        </div>

        <form onSubmit={handleApply} className="surface p-3 flex flex-col sm:flex-row flex-wrap gap-2.5 sm:items-end">
          <div>
            <label className="field-label flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" /> Location
            </label>
            <input
              type="text"
              value={filterLoc}
              onChange={(e) => setFilterLoc(e.target.value)}
              placeholder="Any location"
              className="input text-xs"
              style={{ minWidth: '160px' }}
            />
          </div>

          <div>
            <label className="field-label">Max price (PKR)</label>
            <input
              type="text"
              inputMode="numeric"
              value={filterPrice}
              onChange={(e) => setFilterPrice(e.target.value)}
              placeholder="e.g. 50,000"
              className="input text-xs"
              style={{ minWidth: '130px' }}
            />
          </div>

          <div>
            <label className="field-label">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input text-xs"
              style={{ minWidth: '120px' }}
            >
              <option value="">Any</option>
              <option value="Apartment">Apartment</option>
              <option value="House">House</option>
              <option value="Villa">Villa</option>
              <option value="Studio">Studio</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button type="submit" className="btn btn-primary btn-sm">
              Apply
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClear}
                className="btn btn-ghost btn-sm flex items-center gap-1"
                title="Clear all filters"
              >
                <RotateCcw className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {loading ? (
        <p className="text-sm py-12 text-center" style={{ color: 'var(--ink-faint)' }}>
          Loading listings…
        </p>
      ) : error ? (
        <div className="surface p-12 text-center my-6 space-y-3">
          <p className="text-base font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
            Couldn't load listings
          </p>
          <p className="text-xs max-w-md mx-auto" style={{ color: 'var(--ink-soft)' }}>
            {error} Check your connection and try again.
          </p>
          <button onClick={handleRetry} className="btn btn-primary btn-sm mt-2">
            Retry
          </button>
        </div>
      ) : properties.length === 0 ? (
        <div className="surface p-12 text-center my-6 space-y-3">
          <p className="text-base font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
            No properties match these filters yet
          </p>
          <p className="text-xs max-w-md mx-auto" style={{ color: 'var(--ink-soft)' }}>
            {filterPrice
              ? `No listings found within max budget PKR ${Number(String(filterPrice).replace(/[^0-9.]/g, '')).toLocaleString()}. Try increasing your budget or checking another location.`
              : hasActiveFilters
              ? 'Try broadening your search criteria or clearing active filters.'
              : 'No listings are available right now. Please check back soon.'}
          </p>
          {hasActiveFilters && (
            <button onClick={handleClear} className="btn btn-secondary btn-sm mt-2">
              View all listings
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((p) => (
            <div key={p._id} className="tag-card flex flex-col">
              <span className="tag-card-corner" />
              <div className="h-44 overflow-hidden relative" style={{ background: 'var(--surface-tint)' }}>
                <img
                  src={
                    p.images?.[0] ||
                    'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=60'
                  }
                  alt={p.title}
                  className="w-full h-full object-cover"
                />
                <BookmarkButton
                  propertyId={p._id}
                  isSaved={savedIds.includes(p._id)}
                  onToggle={handleBookmarkToggle}
                  className="absolute top-2.5 right-2.5 z-10"
                />
              </div>
              <div className="p-4 flex-1 flex flex-col gap-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-base line-clamp-1" style={{ color: 'var(--ink)' }}>
                    {p.title}
                  </h3>
                  <span className="font-bold whitespace-nowrap" style={{ color: 'var(--brand)' }}>
                    PKR {p.price?.toLocaleString()}/mo
                  </span>
                </div>
                <PropertyAnalyticsBadge
                  demand={p.demand}
                  locationAnalytics={p.locationAnalytics}
                  viewsCount={p.viewsCount}
                />
                <p className="flex items-center text-xs" style={{ color: 'var(--ink-soft)' }}>
                  <MapPin className="w-3.5 h-3.5 mr-1" /> {p.location}
                </p>
                <p className="text-xs line-clamp-2" style={{ color: 'var(--ink-soft)' }}>
                  {p.description}
                </p>
                <div
                  className="flex items-center gap-4 text-xs mt-1 pt-2 border-t"
                  style={{ borderColor: 'var(--border-soft)', color: 'var(--ink-soft)' }}
                >
                  <span className="flex items-center">
                    <Bed className="w-3.5 h-3.5 mr-1" /> {p.bedrooms}
                  </span>
                  <span className="flex items-center">
                    <Bath className="w-3.5 h-3.5 mr-1" /> {p.bathrooms}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Link
                    to={`/properties/${p._id}`}
                    className="btn btn-secondary btn-sm flex-1 justify-center"
                  >
                    View details
                  </Link>
                  <button
                    onClick={() => handleBook(p._id, p.price)}
                    className="btn btn-primary btn-sm flex-1"
                  >
                    Book now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Properties;
