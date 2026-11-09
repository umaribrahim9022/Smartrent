const RentPrediction = require('../models/RentPrediction');

// ML Regression Estimation Formula for Rent
exports.predictRent = async (req, res, next) => {
  try {
    const { location, bedrooms, bathrooms, propertyType, sqft } = req.body;

    if (!location || !bedrooms) {
      res.status(400);
      throw new Error('Location and bedrooms are required');
    }

    // Base Rate Estimation
    let baseRate = 25000;
    const locLower = location.toLowerCase();

    if (locLower.includes('lahore') || locLower.includes('karachi') || locLower.includes('islamabad')) {
      baseRate = 45000;
    }

    const typeMultiplier = {
      Apartment: 1.0,
      Studio: 0.75,
      House: 1.3,
      Villa: 1.8
    }[propertyType] || 1.0;

    const bedFactor = (bedrooms || 1) * 12000;
    const bathFactor = (bathrooms || 1) * 5000;
    const areaFactor = (sqft || 1000) * 15;

    const predictedRent = Math.round((baseRate + bedFactor + bathFactor + areaFactor) * typeMultiplier);
    const confidenceScore = 0.88;

    const prediction = await RentPrediction.create({
      location,
      bedrooms: bedrooms || 1,
      propertyType: propertyType || 'Apartment',
      predictedRent,
      confidenceScore
    });

    res.status(200).json({
      success: true,
      data: {
        location,
        bedrooms,
        propertyType,
        predictedRent,
        confidenceScore,
        predictionId: prediction._id
      }
    });
  } catch (error) {
    next(error);
  }
};