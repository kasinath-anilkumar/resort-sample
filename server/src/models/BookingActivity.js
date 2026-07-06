const mongoose = require('mongoose');

const bookingActivitySchema = new mongoose.Schema({
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    event: { 
        type: String, 
        enum: [
            'Booking Created', 
            'Booking Confirmed', 
            'Payment Completed', 
            'Booking Cancelled', 
            'Booking Expired', 
            'Check-In', 
            'Check-Out', 
            'Refund Issued'
        ], 
        required: true 
    },
    performedBy: { type: String, default: 'System' },
    timestamp: { type: Date, default: Date.now },
    details: { type: mongoose.Schema.Types.Mixed }
});

module.exports = mongoose.model('BookingActivity', bookingActivitySchema);
