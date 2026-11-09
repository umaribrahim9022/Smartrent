const express = require('express');
const router = express.Router();
const rentPredictionController = require('../controllers/rentPredictionController');

router.post('/', rentPredictionController.predictRent);

module.exports = router;