import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Upload, X, Sparkles } from 'lucide-react';

const AddProperty = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    bedrooms: 1,
    bathrooms: 1,
    propertyType: 'Apartment'
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [suggesting, setSuggesting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSuggestRent = async () => {
    if (!formData.location) {
      setError('Please enter a location first to get AI rent estimation.');
      return;
    }
    setSuggesting(true);
    setError('');
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
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
      setError('Failed to fetch AI rent prediction.');
    } finally {
      setSuggesting(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 5) {
      setError('You can upload a maximum of 5 images.');
      return;
    }
    setError('');
    setSelectedFiles(prev => [...prev, ...files]);
    setPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeImage = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setError('Please select at least one property image.');
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
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const bodyData = new FormData();
    Object.keys(formData).forEach(key => bodyData.append(key, formData[key]));
    selectedFiles.forEach(file => bodyData.append('images', file));
    try {
      const res = await fetch(`${API_BASE}/properties`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: bodyData
      });
      const data = await res.json();
      if (data.success) {
        navigate('/properties');
      } else {
        setError(data.message || 'Failed to publish property');
      }
    } catch (err) {
      setError('Server network error while uploading');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex items-start justify-center">
      <div className="w-full max-w-2xl surface p-6 sm:p-8 space-y-6">

        <div className="flex items-center gap-3 pb-5 border-b" style={{ borderColor: 'var(--border-soft)' }}>
          <div className="p-2 rounded-xl" style={{ background: 'var(--brand-soft)' }}>
            <PlusCircle className="w-6 h-6" style={{ color: 'var(--brand)' }} />
          </div>
          <div>
            <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>List new rental property</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ink-faint)' }}>Fill in the details to publish your listing</p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg text-xs font-medium" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
            {error}
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
              placeholder="Modern 2-bedroom luxury apartment"
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
                <label className="text-xs font-semibold" style={{ color: 'var(--ink-soft)' }}>Monthly price (PKR)</label>
                <button
                  type="button"
                  onClick={handleSuggestRent}
                  disabled={suggesting}
                  className="text-[11px] font-bold flex items-center gap-1 transition"
                  style={{ color: 'var(--brand)' }}
                >
                  <Sparkles className="w-3 h-3" />
                  {suggesting ? 'Estimating…' : 'Suggest AI market rent'}
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

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="field-label">Bedrooms</label>
              <input
                type="number"
                min="1"
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="field-label">Bathrooms</label>
              <input
                type="number"
                min="1"
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
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
            <label className="field-label">Property images (max 5)</label>
            <div
              className="relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition"
              style={{ borderColor: 'var(--border)' }}
            >
              <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--brand)' }} />
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <p className="text-sm font-medium" style={{ color: 'var(--brand)' }}>Click or drag images to upload</p>
              <p className="text-xs mt-1" style={{ color: 'var(--ink-faint)' }}>JPG, PNG, WEBP allowed (max 5MB each)</p>
            </div>

            {previews.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mt-4">
                {previews.map((src, idx) => (
                  <div key={idx} className="relative h-24 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                    <img src={src} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 rounded-full p-0.5 transition"
                      style={{ background: 'var(--danger)', color: 'var(--brand-ink)' }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-block btn-lg mt-2">
            {loading ? 'Uploading & publishing…' : 'Publish property'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProperty;
