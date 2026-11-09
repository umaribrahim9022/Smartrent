const SavedProperty = require('../models/SavedProperty');
const Property = require('../models/Property');

// 1. Get all saved properties for current user
exports.getSavedProperties = async (req, res, next) => {
  try {
    const saved = await SavedProperty.find({ tenant: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'property',
        populate: { path: 'owner', select: 'name email' }
      });

    // Filter out entries where property may have been deleted
    const validSaved = saved.filter(item => item.property != null);

    res.status(200).json({
      success: true,
      count: validSaved.length,
      data: { saved: validSaved }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get list of saved property IDs (fast for batch checking on UI)
exports.getSavedPropertyIds = async (req, res, next) => {
  try {
    const saved = await SavedProperty.find({ tenant: req.user._id }).select('property');
    const ids = saved
      .filter(s => s.property)
      .map(s => s.property.toString());

    res.status(200).json({
      success: true,
      data: { ids }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Save a property
exports.saveProperty = async (req, res, next) => {
  try {
    const { propertyId } = req.body;
    if (!propertyId) {
      return res.status(400).json({ success: false, message: 'Property ID is required' });
    }

    const prop = await Property.findById(propertyId);
    if (!prop) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const existing = await SavedProperty.findOne({ tenant: req.user._id, property: propertyId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Property already saved' });
    }

    const saved = await SavedProperty.create({
      tenant: req.user._id,
      property: propertyId
    });

    res.status(201).json({
      success: true,
      message: 'Property saved successfully',
      data: { saved }
    });
  } catch (error) {
    next(error);
  }
};

// 4. Toggle save status (Save if not saved, Remove if already saved)
exports.toggleSavedProperty = async (req, res, next) => {
  try {
    const { propertyId } = req.body;
    if (!propertyId) {
      return res.status(400).json({ success: false, message: 'Property ID is required' });
    }

    const existing = await SavedProperty.findOne({ tenant: req.user._id, property: propertyId });

    if (existing) {
      await SavedProperty.findByIdAndDelete(existing._id);
      return res.status(200).json({
        success: true,
        saved: false,
        message: 'Property removed from saved listings'
      });
    } else {
      const prop = await Property.findById(propertyId);
      if (!prop) {
        return res.status(404).json({ success: false, message: 'Property not found' });
      }

      const saved = await SavedProperty.create({
        tenant: req.user._id,
        property: propertyId
      });

      return res.status(201).json({
        success: true,
        saved: true,
        message: 'Property added to saved listings',
        data: { saved }
      });
    }
  } catch (error) {
    next(error);
  }
};

// 5. Remove a saved property
exports.removeSavedProperty = async (req, res, next) => {
  try {
    await SavedProperty.findOneAndDelete({
      tenant: req.user._id,
      property: req.params.propertyId
    });

    res.status(200).json({
      success: true,
      message: 'Property removed from saved listings'
    });
  } catch (error) {
    next(error);
  }
};
