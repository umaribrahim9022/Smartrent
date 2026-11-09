const Property = require('../models/Property');
const User = require('../models/User');
const Recommendation = require('../models/Recommendation');

exports.getRecommendations = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const prefs = user.preferences || {};

    const properties = await Property.find({ status: { $ne: 'Rented' } }).populate('owner', 'name email');

    const scoredProperties = properties.map((prop) => {
      let score = 0;
      let matchReasons = [];

      // 1. Location Weight (40%)
      if (prefs.preferredLocation && prop.location.toLowerCase().includes(prefs.preferredLocation.toLowerCase())) {
        score += 0.4;
        matchReasons.push('Location Match');
      }

      // 2. Property Type Weight (25%)
      if (prefs.preferredType && prop.propertyType === prefs.preferredType) {
        score += 0.25;
        matchReasons.push('Type Match');
      }

      // 3. Budget Range Weight (20%)
      if (prefs.maxBudget && prefs.maxBudget > 0) {
        if (prop.price <= prefs.maxBudget) {
          score += 0.2;
          matchReasons.push('Within Budget');
        } else if (prop.price <= prefs.maxBudget * 1.15) {
          score += 0.1;
        }
      } else {
        score += 0.1;
      }

      // 4. Bedrooms Match Weight (15%)
      if (prefs.bedrooms && prop.bedrooms >= prefs.bedrooms) {
        score += 0.15;
        matchReasons.push('Bedrooms Match');
      }

      const matchPercentage = Math.min(Math.round(score * 100), 100);

      return {
        ...prop._doc,
        recommendationScore: parseFloat(score.toFixed(2)),
        matchPercentage,
        matchReasons
      };
    });

    // Score ke hisab se descending order sort karein
    scoredProperties.sort((a, b) => b.recommendationScore - a.recommendationScore);
    const topRecommendations = scoredProperties.slice(0, 6);

    // Save/Update in Recommendation collection
    for (const rec of topRecommendations) {
      await Recommendation.findOneAndUpdate(
        { tenant: req.user._id, property: rec._id },
        { score: rec.recommendationScore },
        { upsert: true, new: true }
      );
    }

    res.status(200).json({
      success: true,
      count: topRecommendations.length,
      data: { recommendations: topRecommendations }
    });
  } catch (error) {
    next(error);
  }
};