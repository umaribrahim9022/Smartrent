const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', notificationController.getNotifications);
router.delete('/', notificationController.clearAllNotifications);
router.put('/read-all', notificationController.markAsRead);
router.put('/:id/read', notificationController.markSingleAsRead);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;