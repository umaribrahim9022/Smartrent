const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reportType: {
      type: String,
      enum: ['System Analytics', 'User Report', 'Financial Summary'],
      required: true
    },
    metrics: {
      totalUsers: { type: Number, default: 0 },
      totalProperties: { type: Number, default: 0 },
      totalBookings: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;