const mongoose = require('mongoose');

const rentPredictionSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property'
    },
    location: {
      type: String,
      required: true
    },
    bedrooms: {
      type: Number,
      required: true
    },
    propertyType: {
      type: String,
      required: true
    },
    predictedRent: {
      type: Number,
      required: true
    },
    confidenceScore: {
      type: Number,
      default: 0.88
    }
  },
  { timestamps: true }
);

const RentPrediction = mongoose.model('RentPrediction', rentPredictionSchema);
module.exports = RentPrediction;