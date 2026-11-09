const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Booking must belong to a property']
    },
    renter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking must belong to a renter']
    },
    startDate: {
      type: Date,
      required: [true, 'Please provide a start date']
    },
    endDate: {
      type: Date,
      required: [true, 'Please provide an end date']
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required']
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;