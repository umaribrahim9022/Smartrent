import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Chatbot from './components/Chatbot';
import Footer from './components/Footer';
import Home from './pages/Home';
import Properties from './pages/Properties';
import Login from './pages/Login';
import Register from './pages/Register';
import Bookings from './pages/Bookings';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import SavedProperties from './pages/SavedProperties';
import AddProperty from './pages/Addproperty';
import EditProperty from './pages/EditProperty';
import AdminDashboard from './pages/AdminDashboard';
import Recommendations from './pages/Recommendations';
import PropertyDetail from './pages/PropertyDetail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const MainLayout = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  return <main className={`flex-grow w-full ${isHome ? '' : 'px-4 py-6'}`}>{children}</main>;
};

function App() {
  return (
    <Router>
      <div className="app-shell flex flex-col justify-between font-sans min-h-screen">
        <Navbar />
        <MainLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/properties/:id" element={<PropertyDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/saved" element={<ProtectedRoute><SavedProperties /></ProtectedRoute>} />
            <Route path="/add-property" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><AddProperty /></ProtectedRoute>} />
            <Route path="/edit-property/:id" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><EditProperty /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
          </Routes>
        </MainLayout>
        <Chatbot />
        <Footer />
      </div>
    </Router>
  );
}

export default App;
