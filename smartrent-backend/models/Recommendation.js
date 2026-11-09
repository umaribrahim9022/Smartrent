const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true
    },
    score: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

const Recommendation = mongoose.model('Recommendation', recommendationSchema);
module.exports = Recommendation;