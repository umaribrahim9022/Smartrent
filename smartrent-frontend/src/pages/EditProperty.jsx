import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Pencil, Upload, X, Sparkles, ArrowLeft, Loader2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const EditProperty = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    bedrooms: 1,
    bathrooms: 1,
    propertyType: 'Apartment',
    status: 'Available'
  });

  const [existingImages, setExistingImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);

  const [loadingProperty, setLoadingProperty] = useState(true);
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await fetch(`${API_BASE}/properties/${id}`);
        const data = await res.json();
        if (data.success && data.data?.property) {
          const prop = data.data.property;

          // Check authorization
          const ownerId = prop.owner?._id || prop.owner;
          if (ownerId !== currentUser._id && currentUser.role !== 'admin') {
            setError('You are not authorized to edit this property listing.');
            setLoadingProperty(false);
            return;
          }

          setFormData({
            title: prop.title || '',
            description: prop.description || '',
            price: prop.price || '',
            location: prop.location || '',
            bedrooms: prop.bedrooms || 1,
            bathrooms: prop.bathrooms || 1,
            propertyType: prop.propertyType || 'Apartment',
            status: prop.status || 'Available'
          });
          setExistingImages(prop.images || []);
        } else {
          setError('Property not found');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch property details.');
      } finally {
        setLoadingProperty(false);
      }
    };

    fetchProperty();
  }, [id, currentUser._id, currentUser.role]);

  const handleSuggestRent = async () => {
    if (!formData.location) {
      setError('Please enter a location first to get AI rent estimation.');
      return;
    }
    setSuggesting(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/rent-prediction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: formData.location,
          bedrooms: Number(formData.bedrooms),
          propertyType: formData.propertyType
        })
      });
      const data = await res.json();
      if (data.success && data.data?.predictedRent) {
        setFormData(prev => ({ ...prev, price: data.data.predictedRent }));
      } else {
        setError('Could not calculate rent estimation for this location.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch AI rent prediction.');
    } finally {
      setSuggesting(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const totalCount = existingImages.length + selectedFiles.length + files.length;
    if (totalCount > 5) {
      setError(`Maximum 5 images allowed. You currently have ${existingImages.length + selectedFiles.length} images.`);
      return;
    }
    setError('');
    setSelectedFiles(prev => [...prev, ...files]);
    setNewPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setNewPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (existingImages.length === 0 && selectedFiles.length === 0) {
      setError('Property must have at least one image.');
      return;
    }

    const numPrice = Number(formData.price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Monthly rent must be a positive amount (at least 1 PKR).');
      return;
    }
    if (Number(formData.bedrooms) < 1) {
      setError('Bedrooms must be at least 1.');
      return;
    }
    if (Number(formData.bathrooms) < 1) {
      setError('Bathrooms must be at least 1.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const bodyData = new FormData();
      Object.keys(formData).forEach(key => {
        bodyData.append(key, formData[key]);
      });

      // Send existing images that the user kept
      existingImages.forEach(img => {
        bodyData.append('existingImages', img);
      });

      // Send newly uploaded files
      selectedFiles.forEach(file => {
        bodyData.append('images', file);
      });

      const res = await fetch(`${API_BASE}/properties/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: bodyData
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Listing updated successfully!');
        setTimeout(() => {
          navigate(`/properties/${id}`);
        }, 1200);
      } else {
        setError(data.message || 'Failed to update property');
      }
    } catch (err) {
      console.error(err);
      setError('Server network error while saving updates.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingProperty) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3" style={{ color: 'var(--ink-soft)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand)' }} />
        <p className="text-sm">Loading property details…</p>
      </div>
    );
  }

  return (
    <div className="w-full flex items-start justify-center pb-12">
      <div className="w-full max-w-2xl surface p-6 sm:p-8 space-y-6">

        <div className="flex items-center justify-between pb-5 border-b" style={{ borderColor: 'var(--border-soft)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ background: 'var(--brand-soft)' }}>
              <Pencil className="w-5 h-5" style={{ color: 'var(--brand)' }} />
            </div>
            <div>
              <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
                Edit property listing
              </h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--ink-faint)' }}>
                Update details, pricing, availability status, or photos
              </p>
            </div>
          </div>

          <Link
            to={`/properties/${id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold hover:opacity-80 transition"
            style={{ color: 'var(--ink-soft)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl text-xs font-medium text-center" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
            {error}
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl text-xs font-medium text-center" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="field-label">Property title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input"
              placeholder="e.g. Modern 2-bedroom luxury apartment"
            />
          </div>

          <div>
            <label className="field-label">Description</label>
            <textarea
              required
              rows="4"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              placeholder="Provide key details about amenities, surroundings, terms..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Location / address</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="input"
                placeholder="Gulberg III, Lahore"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--ink-soft)' }}>
                  Monthly price (PKR)
                </label>
                <button
                  type="button"
                  onClick={handleSuggestRent}
                  disabled={suggesting}
                  className="text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                  style={{ color: 'var(--brand)' }}
                >
                  <Sparkles className="w-3 h-3" />
                  {suggesting ? 'Estimating…' : 'Suggest AI rent'}
                </button>
              </div>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="input"
                placeholder="45000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="field-label">Bedrooms</label>
              <input
                type="number"
                min="1"
                required
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
                className="input"
              />
            </div>

            <div>
              <label className="field-label">Bathrooms</label>
              <input
                type="number"
                min="1"
                required
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
                className="input"
              />
            </div>

            <div>
              <label className="field-label">Property type</label>
              <select
                value={formData.propertyType}
                onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                className="input"
              >
                <option value="Apartment">Apartment</option>
                <option value="House">House</option>
                <option value="Villa">Villa</option>
                <option value="Studio">Studio</option>
              </select>
            </div>
          </div>

          <div>
            <label className="field-label">Listing status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="input"
            >
              <option value="Available">Available for rent</option>
              <option value="Rented">Rented (inactive)</option>
            </select>
          </div>

          {/* Photo Management Section */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="field-label mb-0">Photos (max 5)</label>
              <span className="text-[11px]" style={{ color: 'var(--ink-faint)' }}>
                {existingImages.length + selectedFiles.length} of 5 photos
              </span>
            </div>

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="mb-3">
                <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--ink-faint)' }}>
                  Current photos:
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                  {existingImages.map((imgUrl, idx) => (
                    <div
                      key={`existing-${idx}`}
                      className="relative h-20 rounded-lg overflow-hidden border group"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <img src={imgUrl} alt={`Current ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(idx)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-rose-600 transition"
                        title="Remove photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Upload Previews */}
            {newPreviews.length > 0 && (
              <div className="mb-3">
                <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--brand)' }}>
                  New photos to add:
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                  {newPreviews.map((preview, idx) => (
                    <div
                      key={`new-${idx}`}
                      className="relative h-20 rounded-lg overflow-hidden border-2 border-dashed"
                      style={{ borderColor: 'var(--brand)' }}
                    >
                      <img src={preview} alt={`New preview ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeNewFile(idx)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-rose-600 transition"
                        title="Remove photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Area */}
            {existingImages.length + selectedFiles.length < 5 && (
              <div
                className="relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer hover:opacity-80 transition"
                style={{ borderColor: 'var(--border)' }}
              >
                <Upload className="w-6 h-6 mx-auto mb-1.5" style={{ color: 'var(--brand)' }} />
                <p className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>
                  Click to add photos
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--ink-faint)' }}>
                  PNG, JPG up to 5MB
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-soft)' }}>
            <Link
              to={`/properties/${id}`}
              className="btn btn-secondary flex-1 justify-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary flex-1 justify-center"
            >
              {saving ? 'Saving changes…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProperty;
