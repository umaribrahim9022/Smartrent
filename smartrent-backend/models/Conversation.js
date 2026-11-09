const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    lastMessage: {
      type: String,
      default: ''
    },
    unreadCountTenant: {
      type: Number,
      default: 0
    },
    unreadCountLandlord: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation;