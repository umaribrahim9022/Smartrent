const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

router.use(protect, restrictTo('admin'));

router.get('/stats', adminController.getAdminStats);
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);
router.get('/properties', adminController.getAllProperties);
router.delete('/properties/:id', adminController.deleteProperty);
router.get('/bookings', adminController.getAllBookings);
router.delete('/bookings/:id', adminController.deleteBooking);
router.post('/reports', adminController.generateReport);

module.exports = router;