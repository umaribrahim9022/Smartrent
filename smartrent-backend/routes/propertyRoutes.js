const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const upload = require('../config/cloudinary'); // Multer/Cloudinary setup import kiya

router
  .route('/')
  .get(propertyController.getAllProperties)
  .post(
    protect, 
    restrictTo('owner', 'admin'), 
    upload.array('images', 5), // Create Property par image upload middleware
    propertyController.createProperty
  );

router
  .route('/:id')
  .get(propertyController.getPropertyById)
  .put(
    protect, 
    restrictTo('owner', 'admin'), 
    upload.array('images', 5), // Update Property par image upload middleware
    propertyController.updateProperty
  )
  .delete(
    protect, 
    restrictTo('owner', 'admin'), 
    propertyController.deleteProperty
  );

module.exports = router;