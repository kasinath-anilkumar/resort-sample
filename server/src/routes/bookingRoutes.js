const express = require('express');
const router = express.Router();
const { 
    createBooking, 
    checkAvailability, 
    getBookingById, 
    updateBookingToPaid, 
    getMyBookings, 
    getBookings, 
    cancelBooking,
    checkInBooking,
    checkOutBooking
} = require('../controllers/bookingController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, admin, getBookings)
    .post(protect, createBooking);

router.route('/mybookings').get(protect, getMyBookings);
router.route('/availability').post(checkAvailability);
router.route('/:id').get(protect, getBookingById);
router.route('/:id/pay').put(protect, updateBookingToPaid);
router.route('/:id/cancel').put(protect, admin, cancelBooking);
router.route('/:id/checkin').put(protect, admin, checkInBooking);
router.route('/:id/checkout').put(protect, admin, checkOutBooking);

module.exports = router;
