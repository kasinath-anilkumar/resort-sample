const Booking = require('../models/Booking');
const { logBookingActivity } = require('./activityLogger');

const startExpirationScheduler = () => {
    console.log('Scheduler: Booking expiration scheduler initialized.');
    
    setInterval(async () => {
        try {
            const now = new Date();
            // Find bookings that are Pending and past their expiresAt date
            const expiredBookings = await Booking.find({
                bookingStatus: 'Pending',
                expiresAt: { $lt: now }
            });

            if (expiredBookings.length > 0) {
                for (const booking of expiredBookings) {
                    booking.bookingStatus = 'Expired';
                    booking.paymentStatus = 'Failed';
                    booking.expiresAt = undefined; // Clear the lock
                    await booking.save();

                    // Log activity
                    await logBookingActivity(booking._id, 'Booking Expired', 'System', {
                        expiredAt: now
                    });
                }
                console.log(`Scheduler: Successfully expired ${expiredBookings.length} unpaid pending bookings.`);
            }
        } catch (error) {
            console.error('Scheduler: Error checking expired bookings:', error);
        }
    }, 60000); // Check every 60 seconds
};

module.exports = { startExpirationScheduler };
