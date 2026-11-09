import React, { useState } from 'react';
import { Bookmark, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const BookmarkButton = ({
  propertyId,
  isSaved = false,
  onToggle,
  showText = false,
  className = '',
  buttonVariant = 'icon' // 'icon' | 'badge' | 'button'
}) => {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(isSaved);
  const [loading, setLoading] = useState(false);

  // Sync with prop if it changes
  React.useEffect(() => {
    setSaved(isSaved);
  }, [isSaved]);

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to save properties to your favorites.');
      navigate('/login');
      return;
    }

    if (loading || !propertyId) return;

    // Optimistic update
    const previousState = saved;
    const nextState = !saved;
    setSaved(nextState);
    if (onToggle) onToggle(propertyId, nextState);

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/saved-properties/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ propertyId })
      });
      const data = await res.json();
      if (!data.success) {
        // Revert on failure
        setSaved(previousState);
        if (onToggle) onToggle(propertyId, previousState);
        alert(data.message || 'Failed to update saved status');
      } else {
        setSaved(data.saved);
        if (onToggle) onToggle(propertyId, data.saved);
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      setSaved(previousState);
      if (onToggle) onToggle(propertyId, previousState);
    } finally {
      setLoading(false);
    }
  };

  if (buttonVariant === 'button') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={`btn btn-secondary btn-sm flex items-center gap-1.5 transition ${className}`}
        title={saved ? 'Remove from saved' : 'Save property'}
      >
        <Bookmark
          className={`w-4 h-4 transition ${
            saved
              ? 'fill-[var(--brand)] text-[var(--brand)]'
              : 'text-[var(--ink-soft)]'
          }`}
        />
        <span>{saved ? 'Saved' : 'Save property'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`p-2 rounded-full transition cursor-pointer backdrop-blur-md shadow-sm border ${
        saved
          ? 'bg-[var(--brand-soft)] border-[var(--brand)] text-[var(--brand)]'
          : 'bg-black/40 hover:bg-black/60 border-white/20 text-white hover:text-[var(--brand)]'
      } ${className}`}
      title={saved ? 'Remove from saved' : 'Save to favorites'}
      aria-label={saved ? 'Remove from saved' : 'Save to favorites'}
    >
      <Bookmark
        className={`w-4 h-4 transition ${
          saved ? 'fill-[var(--brand)] text-[var(--brand)]' : ''
        }`}
      />
    </button>
  );
};

export default BookmarkButton;
