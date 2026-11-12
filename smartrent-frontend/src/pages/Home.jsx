import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Search, MapPin, Bed, Bath, Sparkles, TrendingUp, ArrowUpRight } from 'lucide-react';
import BookmarkButton from '../components/BookmarkButton';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const PropertyCard = ({ prop, isSaved, onToggle }) => (
  <Link to={`/properties/${prop._id}`} className="tag-card group flex flex-col">
    <span className="tag-card-corner" />
    <div className="h-44 overflow-hidden relative" style={{ background: 'var(--surface-tint)' }}>
      <img
        src={prop.images?.[0] || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=60'}
        alt={prop.title}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
      {prop.matchPercentage !== undefined && (
        <span className="absolute top-3 left-3 badge badge-brand">
          <Sparkles className="w-3 h-3" /> {prop.matchPercentage}% match
        </span>
      )}
      <BookmarkButton
        propertyId={prop._id}
        isSaved={isSaved}
        onToggle={onToggle}
        className="absolute top-2.5 right-2.5 z-10"
      />
    </div>
    <div className="p-4 flex-1 flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase" style={{ color: 'var(--accent)' }}>{prop.propertyType}</span>
      <h3 className="font-semibold text-base line-clamp-1" style={{ color: 'var(--ink)' }}>{prop.title}</h3>
      <p className="font-bold" style={{ color: 'var(--brand)' }}>PKR {prop.price?.toLocaleString()}/mo</p>
      <p className="flex items-center text-xs" style={{ color: 'var(--ink-soft)' }}>
        <MapPin className="w-3.5 h-3.5 mr-1" /> {prop.location}
      </p>
      <div className="flex items-center gap-4 text-xs mt-1 pt-2 border-t" style={{ borderColor: 'var(--border-soft)', color: 'var(--ink-soft)' }}>
        <span className="flex items-center"><Bed className="w-3.5 h-3.5 mr-1" /> {prop.bedrooms}</span>
        <span className="flex items-center"><Bath className="w-3.5 h-3.5 mr-1" /> {prop.bathrooms}</span>
      </div>
    </div>
  </Link>
);

const StaticPropertyCard = ({ title, price, location, type, match, beds, baths, sqft }) => (
  <div className="tag-card group flex flex-col">
    <span className="tag-card-corner" />
    <div className="h-44 flex items-center justify-center text-sm font-medium" style={{ background: 'var(--surface-tint)', color: 'var(--ink-faint)' }}>
      {type} listing
    </div>
    <div className="p-4 flex-1 flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase" style={{ color: 'var(--accent)' }}>{type}</span>
      <h3 className="font-semibold text-base" style={{ color: 'var(--ink)' }}>{title}</h3>
      <p className="font-bold" style={{ color: 'var(--brand)' }}>PKR {price}/mo</p>
      <p className="flex items-center text-xs" style={{ color: 'var(--ink-soft)' }}>
        <MapPin className="w-3.5 h-3.5 mr-1" /> {location} · {match}% match
      </p>
      <div className="flex items-center gap-4 text-xs mt-1 pt-2 border-t" style={{ borderColor: 'var(--border-soft)', color: 'var(--ink-soft)' }}>
        <span className="flex items-center"><Bed className="w-3.5 h-3.5 mr-1" /> {beds}</span>
        <span className="flex items-center"><Bath className="w-3.5 h-3.5 mr-1" /> {baths}</span>
        <span>{sqft} sqft</span>
      </div>
    </div>
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchLocation, setSearchLocation] = useState('');
  const [searchBudget, setSearchBudget] = useState('');
  const [searchType, setSearchType] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [savedIds, setSavedIds] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`${API_BASE}/recommendations?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        ...headers,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRecommendations(data.data?.recommendations || data.recommendations || []);
        }
      })
      .catch((err) => console.error('Failed to load recommendations:', err))
      .finally(() => setLoadingRecs(false));
  }, [location.key]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchLocation && searchLocation.trim()) params.set('location', searchLocation.trim());
    if (searchBudget) {
      const cleanBudget = String(searchBudget).replace(/[^0-9.]/g, '');
      if (cleanBudget) params.set('maxPrice', cleanBudget);
    }
    if (searchType) params.set('type', searchType);
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, var(--surface-tint) 0%, var(--bg) 70%)' }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6 pt-14 sm:pt-20 pb-16 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <div>
            <span className="badge badge-accent mb-5">
              <Sparkles className="w-3 h-3" /> AI-matched listings, updated daily
            </span>
            <h1
              className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] leading-[1.05] font-semibold mb-5"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}
            >
              A rental search that learns what you actually want.
            </h1>
            <p className="text-base sm:text-lg max-w-xl mb-8" style={{ color: 'var(--ink-soft)' }}>
              Tell SmartRent your budget and neighborhood, and the recommendation engine ranks real listings by fit —
              not just by price. No endless scrolling, no stale ads.
            </p>

            {/* Search form */}
            <form onSubmit={handleSearch} className="surface p-4 sm:p-5 grid sm:grid-cols-[1.4fr_1fr_1fr_auto] gap-3">
              <div>
                <label className="field-label">Location</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--ink-faint)' }} />
                  <input
                    type="text"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    placeholder="Gulberg, Lahore"
                    className="input has-icon-left pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="field-label">Max budget (PKR)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={searchBudget}
                  onChange={(e) => setSearchBudget(e.target.value)}
                  placeholder="50,000"
                  className="input"
                />
              </div>
              <div>
                <label className="field-label">Type</label>
                <select value={searchType} onChange={(e) => setSearchType(e.target.value)} className="input">
                  <option value="">Any</option>
                  <option value="Apartment">Apartment</option>
                  <option value="House">House</option>
                  <option value="Villa">Villa</option>
                  <option value="Studio">Studio</option>
                </select>
              </div>
              <div className="flex items-end">
                <button type="submit" className="btn btn-primary btn-block sm:w-auto h-[42px] mt-auto">
                  <Search className="w-4 h-4" /> Search
                </button>
              </div>
            </form>
          </div>

          {/* AI rent predictor widget */}
          <div className="surface p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>Market pulse</span>
              </div>
              <span className="badge badge-success">+4.2% 6mo</span>
            </div>
            <p className="text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>PKR 65,000<span className="text-sm font-medium" style={{ color: 'var(--ink-soft)' }}>/mo avg</span></p>
            <p className="text-xs mb-5" style={{ color: 'var(--ink-faint)' }}>Average asking rent across active listings this month.</p>
            <div className="flex items-end gap-1.5 h-20">
              {[30, 40, 45, 55, 65, 85].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t"
                  style={{ height: `${h}%`, background: i === 5 ? 'var(--brand)' : 'var(--surface-tint-strong)' }}
                />
              ))}
            </div>
            <p className="text-[11px] mt-3" style={{ color: 'var(--ink-faint)' }}>Last six months, citywide median</p>
          </div>
        </div>
      </section>

      {/* Curated section */}
      <section className="max-w-7xl mx-auto px-5 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-7">
          <div>
            <h2 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>Curated for you</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--ink-soft)' }}>Ranked by the recommendation engine against your saved preferences.</p>
          </div>
          <Link to="/properties" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--brand)' }}>
            Browse all <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingRecs ? (
          <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>Loading matches…</p>
        ) : recommendations.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.slice(0, 6).map((prop) => (
              <PropertyCard
                key={prop._id}
                prop={prop}
                isSaved={savedIds.includes(prop._id)}
                onToggle={handleBookmarkToggle}
              />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StaticPropertyCard title="The Apex Tower" price="85,000" location="Downtown Metro Core" type="Penthouse" match="98" beds="2" baths="2" sqft="1,200" />
            <StaticPropertyCard title="Industrial Arts Loft" price="65,000" location="Westside Creative District" type="Loft" match="95" beds="1" baths="1.5" sqft="950" />
            <StaticPropertyCard title="Verdant Retreat" price="120,000" location="North Hills Greenbelt" type="Eco-Home" match="92" beds="3" baths="2.5" sqft="2,100" />
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
