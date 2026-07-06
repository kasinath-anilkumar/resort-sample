const BookingActivity = require('../models/BookingActivity');

const logBookingActivity = async (bookingId, event, performedBy = 'System', details = {}) => {
    try {
        await BookingActivity.create({
            booking: bookingId,
            event,
            performedBy,
            details
        });
    } catch (err) {
        console.error(`Failed to log booking activity for booking ${bookingId}:`, err);
    }
};

module.exports = { logBookingActivity };
