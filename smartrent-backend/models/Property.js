const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Property must belong to an owner']
    },
    title: {
      type: String,
      required: [true, 'Property title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [1, 'Rent price must be at least 1 PKR']
    },
    location: {
      type: String,
      required: [true, 'Location is required']
    },
    bedrooms: {
      type: Number,
      default: 1,
      min: [1, 'Bedrooms must be at least 1']
    },
    bathrooms: {
      type: Number,
      default: 1,
      min: [1, 'Bathrooms must be at least 1']
    },
    propertyType: {
      type: String,
      enum: ['Apartment', 'Villa', 'House', 'Studio'],
      default: 'Apartment'
    },
    images: [
      {
        type: String
      }
    ],
    status: {
      type: String,
      enum: ['Available', 'Rented'],
      default: 'Available'
    },
    viewsCount: {
      type: Number,
      default: 0
    },
    bookingsCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const Property = mongoose.model('Property', propertySchema);
module.exports = Property;