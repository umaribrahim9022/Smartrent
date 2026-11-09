const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['booking', 'message', 'recommendation', 'system'],
      default: 'booking'
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;