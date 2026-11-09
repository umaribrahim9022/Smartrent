const User = require('../models/User');
const Property = require('../models/Property');
const Booking = require('../models/Booking');
const Report = require('../models/Report');

exports.getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProperties = await Property.countDocuments();
    const totalBookings = await Booking.countDocuments();

    const bookings = await Booking.find({ status: 'approved' });
    const totalRevenue = bookings.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalProperties,
        totalBookings,
        totalRevenue
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, data: { users } });
  } catch (error) {
    next(error);
  }
};

exports.generateReport = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProperties = await Property.countDocuments();
    const totalBookings = await Booking.countDocuments();

    const report = await Report.create({
      generatedBy: req.user._id,
      reportType: 'System Analytics',
      metrics: { totalUsers, totalProperties, totalBookings, totalRevenue: 150000 }
    });

    res.status(201).json({ success: true, data: { report } });
  } catch (error) {
    next(error);
  }
};

// --- DELETE USER ---
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    // Optionally delete their properties and bookings
    await Property.deleteMany({ owner: req.params.id });
    await Booking.deleteMany({ renter: req.params.id });
    
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// --- GET ALL PROPERTIES ---
exports.getAllProperties = async (req, res, next) => {
  try {
    const properties = await Property.find().populate('owner', 'name email');
    res.status(200).json({ success: true, data: { properties } });
  } catch (error) {
    next(error);
  }
};

// --- DELETE PROPERTY ---
exports.deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }
    // Delete associated bookings
    await Booking.deleteMany({ property: req.params.id });
    
    res.status(200).json({ success: true, message: 'Property deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// --- GET ALL BOOKINGS ---
exports.getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .sort({ createdAt: -1 })
      .populate('property', 'title location')
      .populate('renter', 'name email');
    res.status(200).json({ success: true, data: { bookings } });
  } catch (error) {
    next(error);
  }
};

// --- DELETE BOOKING ---
exports.deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.status(200).json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// --- UPDATE USER ROLE ---
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['renter', 'owner', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be renter, owner, or admin' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { notifyUser, generateEmailTemplate } = require('../utils/notifyUser');

    const roleEmailHtml = generateEmailTemplate({
      title: 'Account Role Updated',
      contentHtml: `
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>An administrator has updated your SmartRent account permissions.</p>
        <div class="info-box">
          <p style="margin: 0; color: #6366f1; font-weight: 800; font-size: 16px; text-transform: uppercase;">
            New Role: ${role}
          </p>
        </div>
        <p>You can now access all features associated with the <strong>${role}</strong> role.</p>
      `,
      actionUrl: 'http://localhost:5173/profile',
      actionText: 'View My Profile'
    });

    await notifyUser({
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      text: `Your account role has been updated to "${role}".`,
      type: 'system',
      io: req.io,
      emailSubject: `🛡️ SmartRent Account Role Updated to ${role.toUpperCase()}`,
      emailHtml: roleEmailHtml
    });

    res.status(200).json({
      success: true,
      data: { user },
      message: `User role updated to ${role} successfully`
    });
  } catch (error) {
    next(error);
  }
};