const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, recommendationController.getRecommendations);

module.exports = router;