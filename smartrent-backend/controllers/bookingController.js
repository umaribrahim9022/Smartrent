const Booking = require('../models/Booking');
const Property = require('../models/Property');
const User = require('../models/User');
const { notifyUser, generateEmailTemplate } = require('../utils/notifyUser');

exports.createBooking = async (req, res, next) => {
  try {
    const { propertyId, startDate, endDate, totalPrice } = req.body;

    const property = await Property.findById(propertyId).populate('owner', 'name email');
    if (!property) {
      res.status(404);
      throw new Error('Property not found');
    }

    const booking = await Booking.create({
      property: propertyId,
      renter: req.user._id,
      startDate,
      endDate,
      totalPrice
    });

    property.bookingsCount += 1;
    await property.save();

    const formattedStart = startDate ? new Date(startDate).toLocaleDateString() : 'N/A';
    const formattedEnd = endDate ? new Date(endDate).toLocaleDateString() : 'N/A';
    const priceFormatted = Number(totalPrice).toLocaleString();

    // 1. Notify Property Owner (In-App + Rich Email)
    if (property.owner) {
      const ownerEmailHtml = generateEmailTemplate({
        title: 'New Booking Request Received!',
        contentHtml: `
          <p>Hello <strong>${property.owner.name}</strong>,</p>
          <p>You have received a new booking request for your property:</p>
          <div class="info-box">
            <p style="margin: 0 0 8px; color: #ffffff; font-weight: bold; font-size: 15px;">${property.title}</p>
            <p style="margin: 0 0 6px;">📍 <strong>Location:</strong> ${property.location}</p>
            <p style="margin: 0 0 6px;">👤 <strong>Renter:</strong> ${req.user.name} (${req.user.email})</p>
            <p style="margin: 0 0 6px;">📅 <strong>Dates:</strong> ${formattedStart} to ${formattedEnd}</p>
            <p style="margin: 0; color: #6366f1; font-weight: 800; font-size: 15px;">💰 Total Rent: ${priceFormatted} PKR</p>
          </div>
          <p>Please log in to your SmartRent dashboard to Approve or Reject this booking.</p>
        `,
        actionUrl: 'http://localhost:5173/bookings',
        actionText: 'Review Booking on SmartRent'
      });

      await notifyUser({
        userId: property.owner._id,
        userEmail: property.owner.email,
        userName: property.owner.name,
        text: `New booking request from ${req.user.name} for "${property.title}" (${priceFormatted} PKR)`,
        type: 'booking',
        io: req.io,
        emailSubject: `🏠 New Booking Request: "${property.title}"`,
        emailHtml: ownerEmailHtml
      });
    }

    // 2. Notify Renter (In-App + Confirmation Email)
    const renterEmailHtml = generateEmailTemplate({
      title: 'Booking Request Submitted Successfully!',
      contentHtml: `
        <p>Hello <strong>${req.user.name}</strong>,</p>
        <p>Your booking request has been submitted to the property owner.</p>
        <div class="info-box">
          <p style="margin: 0 0 8px; color: #ffffff; font-weight: bold; font-size: 15px;">${property.title}</p>
          <p style="margin: 0 0 6px;">📍 <strong>Location:</strong> ${property.location}</p>
          <p style="margin: 0 0 6px;">📅 <strong>Dates:</strong> ${formattedStart} to ${formattedEnd}</p>
          <p style="margin: 0; color: #6366f1; font-weight: 800; font-size: 15px;">💰 Total Rent: ${priceFormatted} PKR</p>
        </div>
        <p>We will notify you immediately once the owner reviews and approves your booking.</p>
      `,
      actionUrl: 'http://localhost:5173/bookings',
      actionText: 'View My Bookings'
    });

    await notifyUser({
      userId: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      text: `Your booking request for "${property.title}" was submitted successfully.`,
      type: 'booking',
      io: req.io,
      emailSubject: `📋 Booking Request Placed: "${property.title}"`,
      emailHtml: renterEmailHtml
    });

    res.status(201).json({
      success: true,
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserBookings = async (req, res, next) => {
  try {
    let filter = {};
    if (req.user.role === 'renter') {
      filter.renter = req.user._id;
    } else if (req.user.role === 'owner') {
      const properties = await Property.find({ owner: req.user._id });
      const propertyIds = properties.map((p) => p._id);
      filter.property = { $in: propertyIds };
    }

    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .populate('property', 'title price location images')
      .populate('renter', 'name email');

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: { bookings }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      res.status(400);
      throw new Error('Invalid status update value');
    }

    const booking = await Booking.findById(req.params.id)
      .populate('property')
      .populate('renter', 'name email');

    if (!booking) {
      res.status(404);
      throw new Error('Booking not found');
    }

    if (booking.property.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('You do not have permission to update this booking');
    }

    booking.status = status;
    await booking.save();

    // Notify renter via In-App + Email
    if (booking.renter) {
      const isApproved = status === 'approved';
      const statusTitle = isApproved ? '🎉 Booking Approved!' : '❌ Booking Request Update';
      const renterEmailHtml = generateEmailTemplate({
        title: statusTitle,
        contentHtml: `
          <p>Hello <strong>${booking.renter.name}</strong>,</p>
          <p>Your booking request for <strong>${booking.property?.title}</strong> has been <strong style="color: ${isApproved ? '#10b981' : '#ef4444'};">${status.toUpperCase()}</strong> by the property owner.</p>
          ${isApproved 
            ? '<p>Congratulations! You can now view complete booking details, coordinates, and contact the owner through SmartRent messages.</p>' 
            : '<p>The owner was unable to accept this booking. Please check our other available properties matching your budget and location.</p>'}
        `,
        actionUrl: 'http://localhost:5173/bookings',
        actionText: 'View Booking Details'
      });

      await notifyUser({
        userId: booking.renter._id,
        userEmail: booking.renter.email,
        userName: booking.renter.name,
        text: `Your booking request for "${booking.property?.title}" has been ${status}.`,
        type: 'booking',
        io: req.io,
        emailSubject: `${isApproved ? '🎉 Booking Approved' : 'Booking Update'}: "${booking.property?.title}"`,
        emailHtml: renterEmailHtml
      });
    }

    res.status(200).json({
      success: true,
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('property')
      .populate('renter', 'name email');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only renter, property owner, or admin can cancel/delete
    const isRenter = booking.renter._id.toString() === req.user._id.toString();
    const isOwner = booking.property && booking.property.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isRenter && !isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this booking' });
    }

    await Booking.findByIdAndDelete(req.params.id);

    // Notify the other party via In-App + Email
    let targetUser = null;
    if (isRenter && booking.property?.owner) {
      targetUser = await User.findById(booking.property.owner);
    } else if (!isRenter && booking.renter) {
      targetUser = booking.renter;
    }

    if (targetUser) {
      const cancelEmailHtml = generateEmailTemplate({
        title: 'Booking Request Cancelled',
        contentHtml: `
          <p>Hello <strong>${targetUser.name}</strong>,</p>
          <p>The booking reservation for <strong>"${booking.property?.title || 'Property'}"</strong> has been cancelled by ${req.user.name}.</p>
        `,
        actionUrl: 'http://localhost:5173/bookings',
        actionText: 'Check Bookings'
      });

      await notifyUser({
        userId: targetUser._id,
        userEmail: targetUser.email,
        userName: targetUser.name,
        text: `Booking reservation for "${booking.property?.title || 'Property'}" was cancelled by ${req.user.name}.`,
        type: 'booking',
        io: req.io,
        emailSubject: `⚠️ Booking Cancelled: "${booking.property?.title || 'Property'}"`,
        emailHtml: cancelEmailHtml
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};