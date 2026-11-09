const express = require('express');
const router = express.Router();
const savedPropertyController = require('../controllers/savedPropertyController');
const { protect } = require('../middlewares/authMiddleware');

// All saved property endpoints require authentication
router.use(protect);

router.get('/', savedPropertyController.getSavedProperties);
router.get('/ids', savedPropertyController.getSavedPropertyIds);
router.post('/', savedPropertyController.saveProperty);
router.post('/toggle', savedPropertyController.toggleSavedProperty);
router.delete('/:propertyId', savedPropertyController.removeSavedProperty);

module.exports = router;
