import React, { useEffect, useState } from 'react';
import { 
  Users, Home, Calendar, DollarSign, Trash2, Shield, UserCheck, 
  ExternalLink, Search, CheckCircle2, AlertCircle, Loader2, MapPin, Building,
  Clock, CheckCircle, XCircle, Pencil
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalProperties: 0, totalBookings: 0, totalRevenue: 0 });
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'properties' | 'bookings'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // id of item being modified
  const [notification, setNotification] = useState(null);
  
  // Search states
  const [userSearch, setUserSearch] = useState('');
  const [propertySearch, setPropertySearch] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const token = localStorage.getItem('token');

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch stats
      const statsRes = await fetch(`${API_BASE}/admin/stats`, { headers });
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.data);

      // Fetch users
      const usersRes = await fetch(`${API_BASE}/admin/users`, { headers });
      const usersData = await usersRes.json();
      if (usersData.success) setUsers(usersData.data.users || []);

      // Fetch properties
      const propsRes = await fetch(`${API_BASE}/admin/properties`, { headers });
      const propsData = await propsRes.json();
      if (propsData.success) setProperties(propsData.data.properties || []);

      // Fetch bookings
      const bookingsRes = await fetch(`${API_BASE}/admin/bookings`, { headers });
      const bookingsData = await bookingsRes.json();
      if (bookingsData.success) setBookings(bookingsData.data.bookings || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      showNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ── Handle Change User Role ──
  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(`role-${userId}`);
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();

      if (data.success) {
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
        showNotification(data.message || `User role updated to ${newRole}`);
      } else {
        showNotification(data.message || 'Failed to update user role', 'error');
      }
    } catch (err) {
      console.error('Role update error:', err);
      showNotification('Server error while updating role', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Handle Delete User ──
  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This cannot be undone.`)) return;

    setActionLoading(`user-del-${userId}`);
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        setUsers(prev => prev.filter(u => u._id !== userId));
        setStats(prev => ({ ...prev, totalUsers: Math.max(0, prev.totalUsers - 1) }));
        showNotification(`User "${userName}" deleted successfully`);
      } else {
        showNotification(data.message || 'Failed to delete user', 'error');
      }
    } catch (err) {
      console.error('Delete user error:', err);
      showNotification('Server error while deleting user', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Handle Delete Property ──
  const handleDeleteProperty = async (propertyId, propertyTitle) => {
    if (!window.confirm(`Are you sure you want to delete the property "${propertyTitle}"? This will remove all associated bookings.`)) return;

    setActionLoading(`prop-del-${propertyId}`);
    try {
      const res = await fetch(`${API_BASE}/admin/properties/${propertyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        setProperties(prev => prev.filter(p => p._id !== propertyId));
        // Also remove related bookings from state
        setBookings(prev => prev.filter(b => b.property?._id !== propertyId));
        setStats(prev => ({ ...prev, totalProperties: Math.max(0, prev.totalProperties - 1) }));
        showNotification(`Property "${propertyTitle}" deleted successfully`);
      } else {
        showNotification(data.message || 'Failed to delete property', 'error');
      }
    } catch (err) {
      console.error('Delete property error:', err);
      showNotification('Server error while deleting property', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Handle Delete Booking ──
  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete/cancel this booking record?')) return;

    setActionLoading(`booking-del-${bookingId}`);
    try {
      const res = await fetch(`${API_BASE}/admin/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        setBookings(prev => prev.filter(b => b._id !== bookingId));
        setStats(prev => ({ ...prev, totalBookings: Math.max(0, prev.totalBookings - 1) }));
        showNotification('Booking deleted successfully');
      } else {
        showNotification(data.message || 'Failed to delete booking', 'error');
      }
    } catch (err) {
      console.error('Delete booking error:', err);
      showNotification('Server error while deleting booking', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'var(--brand)' },
    { label: 'Total Listings', value: stats.totalProperties, icon: Home, color: '#3b82f6' },
    { label: 'Total Bookings', value: stats.totalBookings, icon: Calendar, color: '#10b981' },
    { label: 'Platform Revenue', value: `${stats.totalRevenue.toLocaleString()} PKR`, icon: DollarSign, color: '#f59e0b' },
  ];

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredProperties = properties.filter(p => 
    p.title?.toLowerCase().includes(propertySearch.toLowerCase()) || 
    p.location?.toLowerCase().includes(propertySearch.toLowerCase()) ||
    p.propertyType?.toLowerCase().includes(propertySearch.toLowerCase()) ||
    p.owner?.name?.toLowerCase().includes(propertySearch.toLowerCase())
  );

  const filteredBookings = bookings.filter(b => 
    b.property?.title?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
    b.property?.location?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
    b.renter?.name?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
    b.renter?.email?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
    b.status?.toLowerCase().includes(bookingSearch.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
            Admin Control Center
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-soft)' }}>
            Manage user roles, platform permissions, delete properties, and remove bookings.
          </p>
        </div>

        {/* Global Alert Notification */}
        {notification && (
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border shadow-lg transition-all animate-in fade-in slide-in-from-top-2 ${
            notification.type === 'error' 
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' 
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
          }`}>
            {notification.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{notification.message}</span>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="surface p-5 rounded-2xl flex items-center gap-4 border shadow-sm" style={{ borderColor: 'var(--border)' }}>
            <div className="p-3 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--surface-tint)', color }}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold uppercase tracking-wider truncate" style={{ color: 'var(--ink-faint)' }}>{label}</p>
              <h3 className="text-xl font-extrabold truncate mt-0.5" style={{ color: 'var(--ink)' }}>{value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b overflow-x-auto no-scrollbar" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition -mb-px whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Roles</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold ml-1 bg-slate-800 text-slate-300">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('properties')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition -mb-px whitespace-nowrap ${
            activeTab === 'properties'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Property Listings & Delete</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold ml-1 bg-slate-800 text-slate-300">
            {properties.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition -mb-px whitespace-nowrap ${
            activeTab === 'bookings'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Bookings & Delete</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold ml-1 bg-slate-800 text-slate-300">
            {bookings.length}
          </span>
        </button>
      </div>

      {/* TAB 1: USERS & ROLE MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="surface p-6 rounded-2xl border space-y-4 shadow-sm" style={{ borderColor: 'var(--border)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
                Registered Users & Roles
              </h2>
              <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>
                Change user access level (Renter, Owner, or Admin) or delete accounts.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--ink-faint)' }} />
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="input has-icon-left text-xs w-full pl-10 pr-3 py-2 rounded-xl"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3" style={{ color: 'var(--ink-soft)' }}>
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <p className="text-xs">Loading users list...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center" style={{ color: 'var(--ink-soft)' }}>
              <p className="text-sm">No users found matching your search.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border-soft)' }}>
              <table className="w-full text-left text-sm" style={{ color: 'var(--ink-soft)' }}>
                <thead className="text-[11px] font-bold uppercase tracking-wider border-b" style={{ background: 'var(--surface-tint)', borderColor: 'var(--border)', color: 'var(--ink-faint)' }}>
                  <tr>
                    <th className="px-4 py-3.5">User</th>
                    <th className="px-4 py-3.5">Email</th>
                    <th className="px-4 py-3.5">Current Role</th>
                    <th className="px-4 py-3.5">Change Role</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
                  {filteredUsers.map((u) => {
                    const isChanging = actionLoading === `role-${u._id}`;
                    const isDeleting = actionLoading === `user-del-${u._id}`;
                    return (
                      <tr key={u._id} className="hover:bg-slate-500/5 transition">
                        <td className="px-4 py-3 font-semibold" style={{ color: 'var(--ink)' }}>
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                              {u.name ? u.name.charAt(0).toUpperCase() : '?'}
                            </span>
                            <span>{u.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--ink-soft)' }}>{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase border ${
                            u.role === 'admin'
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                              : u.role === 'owner'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                          }`}>
                            <Shield className="w-3 h-3" />
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <select
                              disabled={isChanging}
                              value={u.role}
                              onChange={(e) => handleRoleChange(u._id, e.target.value)}
                              className="input text-xs font-semibold py-1.5 px-2.5 rounded-lg border cursor-pointer focus:ring-1 focus:ring-indigo-500"
                              style={{ background: 'var(--surface-tint)', borderColor: 'var(--border)' }}
                            >
                              <option value="renter">Renter</option>
                              <option value="owner">Owner</option>
                              <option value="admin">Admin</option>
                            </select>
                            {isChanging && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            disabled={isDeleting}
                            onClick={() => handleDeleteUser(u._id, u.name)}
                            className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition border border-transparent hover:border-rose-500/30 disabled:opacity-50"
                            title="Delete user account"
                          >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROPERTIES MANAGEMENT & DELETION */}
      {activeTab === 'properties' && (
        <div className="surface p-6 rounded-2xl border space-y-4 shadow-sm" style={{ borderColor: 'var(--border)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
                Manage & Delete Properties
              </h2>
              <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>
                Review live listings, open public details, or permanently remove spam/outdated properties.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--ink-faint)' }} />
              <input
                type="text"
                placeholder="Search properties..."
                value={propertySearch}
                onChange={(e) => setPropertySearch(e.target.value)}
                className="input has-icon-left text-xs w-full pl-10 pr-3 py-2 rounded-xl"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3" style={{ color: 'var(--ink-soft)' }}>
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <p className="text-xs">Loading property listings...</p>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="py-12 text-center" style={{ color: 'var(--ink-soft)' }}>
              <p className="text-sm">No properties found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border-soft)' }}>
              <table className="w-full text-left text-sm" style={{ color: 'var(--ink-soft)' }}>
                <thead className="text-[11px] font-bold uppercase tracking-wider border-b" style={{ background: 'var(--surface-tint)', borderColor: 'var(--border)', color: 'var(--ink-faint)' }}>
                  <tr>
                    <th className="px-4 py-3.5">Property Details</th>
                    <th className="px-4 py-3.5">Location</th>
                    <th className="px-4 py-3.5">Rent / Month</th>
                    <th className="px-4 py-3.5">Type & Bed</th>
                    <th className="px-4 py-3.5">Owner</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
                  {filteredProperties.map((p) => {
                    const isDeleting = actionLoading === `prop-del-${p._id}`;
                    return (
                      <tr key={p._id} className="hover:bg-slate-500/5 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border" style={{ background: 'var(--surface-tint)', borderColor: 'var(--border)' }}>
                              {p.images && p.images[0] ? (
                                <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-500">
                                  <Building className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                            <div className="overflow-hidden max-w-[220px]">
                              <p className="font-bold text-xs truncate" style={{ color: 'var(--ink)' }}>{p.title}</p>
                              <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 ${
                                p.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                              }`}>
                                {p.status || 'Available'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--ink-soft)' }}>
                          <span className="flex items-center gap-1 truncate max-w-[150px]">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            {p.location}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-extrabold" style={{ color: 'var(--brand)' }}>
                          {p.price?.toLocaleString()} PKR
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span className="font-medium" style={{ color: 'var(--ink)' }}>{p.propertyType || 'Apartment'}</span>
                          <span className="text-slate-500 text-[11px] block">{p.bedrooms || 1} Bed · {p.bathrooms || 1} Bath</span>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--ink-soft)' }}>
                          <p className="font-semibold text-slate-300">{p.owner?.name || 'Unknown'}</p>
                          <p className="text-[10px] text-slate-500">{p.owner?.email || 'N/A'}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              to={`/properties/${p._id}`}
                              target="_blank"
                              className="p-2 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition border border-transparent hover:border-indigo-500/30"
                              title="View live property listing"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>

                            <Link
                              to={`/edit-property/${p._id}`}
                              className="p-2 rounded-lg text-amber-500 hover:bg-amber-500/10 transition border border-transparent hover:border-amber-500/30"
                              title="Edit this property listing"
                            >
                              <Pencil className="w-4 h-4" />
                            </Link>

                            <button
                              disabled={isDeleting}
                              onClick={() => handleDeleteProperty(p._id, p.title)}
                              className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition border border-transparent hover:border-rose-500/30 disabled:opacity-50"
                              title="Delete this property listing"
                            >
                              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BOOKINGS MANAGEMENT & DELETION */}
      {activeTab === 'bookings' && (
        <div className="surface p-6 rounded-2xl border space-y-4 shadow-sm" style={{ borderColor: 'var(--border)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
                Platform Bookings & Cancellation
              </h2>
              <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>
                View all bookings, inspect renter details, and remove or cancel obsolete bookings.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--ink-faint)' }} />
              <input
                type="text"
                placeholder="Search bookings..."
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                className="input has-icon-left text-xs w-full pl-10 pr-3 py-2 rounded-xl"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3" style={{ color: 'var(--ink-soft)' }}>
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <p className="text-xs">Loading platform bookings...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="py-12 text-center" style={{ color: 'var(--ink-soft)' }}>
              <p className="text-sm">No bookings found matching your search.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border-soft)' }}>
              <table className="w-full text-left text-sm" style={{ color: 'var(--ink-soft)' }}>
                <thead className="text-[11px] font-bold uppercase tracking-wider border-b" style={{ background: 'var(--surface-tint)', borderColor: 'var(--border)', color: 'var(--ink-faint)' }}>
                  <tr>
                    <th className="px-4 py-3.5">Property</th>
                    <th className="px-4 py-3.5">Renter Details</th>
                    <th className="px-4 py-3.5">Total Amount</th>
                    <th className="px-4 py-3.5">Dates</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
                  {filteredBookings.map((b) => {
                    const isDeleting = actionLoading === `booking-del-${b._id}`;
                    return (
                      <tr key={b._id} className="hover:bg-slate-500/5 transition">
                        <td className="px-4 py-3">
                          <div className="max-w-[200px]">
                            <p className="font-bold text-xs truncate" style={{ color: 'var(--ink)' }}>
                              {b.property?.title || 'Unknown Property'}
                            </p>
                            <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                              <MapPin className="w-3 h-3 shrink-0" />
                              {b.property?.location || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--ink-soft)' }}>
                          <p className="font-semibold text-slate-300">{b.renter?.name || 'Unknown Renter'}</p>
                          <p className="text-[10px] text-slate-500">{b.renter?.email || 'N/A'}</p>
                        </td>
                        <td className="px-4 py-3 text-xs font-extrabold" style={{ color: 'var(--brand)' }}>
                          {b.totalPrice ? `${b.totalPrice.toLocaleString()} PKR` : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-[11px]" style={{ color: 'var(--ink-faint)' }}>
                          <p className="font-medium text-slate-300">
                            {b.startDate ? new Date(b.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'} – {b.endDate ? new Date(b.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                          </p>
                          {b.createdAt && (
                            <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 shrink-0" />
                              Booked: {new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(b.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                            b.status === 'approved'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : b.status === 'rejected'
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          }`}>
                            {b.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                            {b.status === 'rejected' && <XCircle className="w-3 h-3" />}
                            {b.status === 'pending' && <Clock className="w-3 h-3" />}
                            {b.status || 'pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            disabled={isDeleting}
                            onClick={() => handleDeleteBooking(b._id)}
                            className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition border border-transparent hover:border-rose-500/30 disabled:opacity-50"
                            title="Delete this booking record"
                          >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
