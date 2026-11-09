const Property = require('../models/Property');
const { calculateDemand, calculateLocationScore } = require('../utils/analyticsHelper');

// 1. Get All Properties (with Search, Query Filters & Analytics)
exports.getAllProperties = async (req, res, next) => {
  try {
    const { location, type, budget, maxPrice, minPrice, bedrooms, owner } = req.query;
    let query = {};

    if (location && location.trim()) {
      query.location = { $regex: location.trim(), $options: 'i' };
    }
    if (type && type.trim()) {
      query.propertyType = type.trim();
    }

    const budgetVal = budget || maxPrice;
    if (budgetVal || minPrice) {
      query.price = {};
      if (budgetVal) {
        const numBudget = Number(String(budgetVal).replace(/[^0-9.]/g, ''));
        if (!isNaN(numBudget) && numBudget > 0) {
          query.price.$lte = numBudget;
        }
      }
      if (minPrice) {
        const numMin = Number(String(minPrice).replace(/[^0-9.]/g, ''));
        if (!isNaN(numMin) && numMin > 0) {
          query.price.$gte = numMin;
        }
      }
      if (Object.keys(query.price).length === 0) {
        delete query.price;
      }
    }

    if (bedrooms && !isNaN(Number(bedrooms))) {
      query.bedrooms = { $gte: Number(bedrooms) };
    }

    if (owner) {
      query.owner = owner;
    }

    const properties = await Property.find(query).populate('owner', 'name email');
    
    // Inject Demand Indicator and Location Analytics dynamically
    const formattedProperties = properties.map(prop => {
      const demand = calculateDemand(prop.viewsCount || 0, prop.bookingsCount || 0);
      const locationAnalytics = calculateLocationScore(prop.location || '');
      return {
        ...prop._doc,
        demand,
        locationAnalytics
      };
    });

    res.status(200).json({
      success: true,
      count: formattedProperties.length,
      data: { properties: formattedProperties }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Single Property by ID (Increments viewsCount & returns Analytics)
exports.getPropertyById = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id).populate('owner', 'name email');
    if (!property) {
      res.status(404);
      throw new Error('Property not found');
    }

    // Increment views count for demand calculations
    property.viewsCount = (property.viewsCount || 0) + 1;
    await property.save();

    const demand = calculateDemand(property.viewsCount, property.bookingsCount || 0);
    const locationAnalytics = calculateLocationScore(property.location);

    res.status(200).json({
      success: true,
      data: { 
        property: {
          ...property._doc,
          demand,
          locationAnalytics
        } 
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Create Property (Owner/Admin) - WITH MULTER/CLOUDINARY
exports.createProperty = async (req, res, next) => {
  try {
    req.body.owner = req.user._id;

    const priceNum = Number(req.body.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Monthly rent must be a positive number (at least 1 PKR)'
      });
    }

    if (req.files && req.files.length > 0) {
      req.body.images = req.files.map(file => file.path);
    } else {
      req.body.images = [];
    }

    const newProperty = await Property.create(req.body);

    res.status(201).json({
      success: true,
      data: { property: newProperty }
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update Property (Owner/Admin) - WITH MULTER/CLOUDINARY
exports.updateProperty = async (req, res, next) => {
  try {
    let property = await Property.findById(req.params.id);
    if (!property) {
      res.status(404);
      throw new Error('Property not found');
    }

    if (property.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to update this property');
    }

    if (req.body.price !== undefined) {
      const priceNum = Number(req.body.price);
      if (isNaN(priceNum) || priceNum <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Monthly rent must be a positive number (at least 1 PKR)'
        });
      }
    }

    // Handle image updates
    let updatedImages = [];
    if (req.body.existingImages) {
      const existing = Array.isArray(req.body.existingImages)
        ? req.body.existingImages
        : [req.body.existingImages];
      updatedImages.push(...existing);
    } else if (req.body.images && (!req.files || req.files.length === 0)) {
      const imgs = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
      updatedImages.push(...imgs);
    } else if (!req.files || req.files.length === 0) {
      updatedImages = property.images || [];
    }

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.path);
      updatedImages.push(...newImages);
    }

    req.body.images = updatedImages;
    delete req.body.existingImages;
    delete req.body.owner;

    property = await Property.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: { property }
    });
  } catch (error) {
    next(error);
  }
};

// 5. Delete Property (Owner/Admin)
exports.deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      res.status(404);
      throw new Error('Property not found');
    }

    if (property.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to delete this property');
    }

    await Property.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Property removed successfully'
    });
  } catch (error) {
    next(error);
  }
};