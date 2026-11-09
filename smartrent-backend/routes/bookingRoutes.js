const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

router.use(protect);

router
  .route('/')
  .get(bookingController.getUserBookings)
  .post(restrictTo('renter'), bookingController.createBooking);

router
  .route('/:id')
  .delete(bookingController.cancelBooking);

router
  .route('/:id/status')
  .patch(restrictTo('owner', 'admin'), bookingController.updateBookingStatus);

module.exports = router;