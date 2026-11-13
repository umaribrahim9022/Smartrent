import React, { useEffect, useState } from 'react';
import { Sparkles, MapPin, Bed, Bath, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getStoredToken } from '../utils/authStorage';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      const token = getStoredToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/recommendations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setRecommendations(data.data.recommendations || []);
        }
      } catch (err) {
        console.error('Failed to load recommendations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const handleBook = async (propertyId, price) => {
    const token = getStoredToken();
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
      alert('Error booking property');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Sparkles className="w-10 h-10 animate-spin mb-3" style={{ color: 'var(--brand)' }} />
        <p className="font-medium text-sm" style={{ color: 'var(--ink-soft)' }}>Matching properties to your preferences…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="surface p-8 relative overflow-hidden" style={{ background: 'var(--surface-tint)' }}>
        <div className="flex items-center space-x-2 font-semibold mb-2" style={{ color: 'var(--accent)' }}>
          <Sparkles className="w-5 h-5" />
          <span>AI multi-vector recommendation engine</span>
        </div>
        <h1 className="text-3xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>Properties tailored for you</h1>
        <p className="text-sm mt-2 max-w-2xl" style={{ color: 'var(--ink-soft)' }}>
          Based on your preferred location, budget, property type, and space requirements. Update your profile preferences anytime to tune matches.
        </p>
        <Link to="/profile" className="btn btn-primary btn-sm mt-4 inline-flex">
          <span>Tune AI preferences</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {recommendations.length === 0 ? (
        <div className="surface p-12 text-center">
          <p className="mb-4" style={{ color: 'var(--ink-soft)' }}>No AI recommendations found based on your current preferences.</p>
          <Link to="/profile" className="btn btn-primary">Set preferences in profile</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((prop) => (
            <div key={prop._id} className="tag-card flex flex-col justify-between relative">
              <span className="tag-card-corner" />
              <div className="absolute top-3 left-3 badge badge-brand z-10">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{prop.matchPercentage}% match</span>
              </div>

              <div>
                <div className="h-48 w-full flex items-center justify-center font-medium relative" style={{ background: 'var(--surface-tint)', color: 'var(--ink-faint)' }}>
                  {prop.images && prop.images[0] ? (
                    <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover" />
                  ) : (
                    <span>{prop.propertyType} image</span>
                  )}
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <h2 className="text-lg font-semibold line-clamp-1" style={{ color: 'var(--ink)' }}>{prop.title}</h2>
                    <span className="font-extrabold text-lg" style={{ color: 'var(--brand)' }}>PKR {prop.price?.toLocaleString()}/mo</span>
                  </div>

                  <p className="flex items-center text-xs" style={{ color: 'var(--ink-soft)' }}>
                    <MapPin className="w-3.5 h-3.5 mr-1" />
                    {prop.location}
                  </p>

                  <p className="text-xs line-clamp-2" style={{ color: 'var(--ink-soft)' }}>{prop.description}</p>

                  {prop.matchReasons && prop.matchReasons.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {prop.matchReasons.map((reason, idx) => (
                        <span key={idx} className="badge badge-accent" style={{ fontSize: '10px' }}>
                          <CheckCircle className="w-2.5 h-2.5" />
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs pt-3 border-t" style={{ borderColor: 'var(--border-soft)', color: 'var(--ink-soft)' }}>
                    <span className="flex items-center"><Bed className="w-4 h-4 mr-1" style={{ color: 'var(--brand)' }} /> {prop.bedrooms} beds</span>
                    <span className="flex items-center"><Bath className="w-4 h-4 mr-1" style={{ color: 'var(--brand)' }} /> {prop.bathrooms} baths</span>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <button onClick={() => handleBook(prop._id, prop.price)} className="btn btn-primary btn-block">
                  Book recommended property
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Recommendations;
