const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    room: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Room', 
        required: function() { return !this.package; } 
    },
    package: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
    roomsBooked: { type: Number, default: 1, required: true },
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },
    guests: {
        adults: { type: Number, default: 1 },
        extraAdults: { type: Number, default: 0 },
        children: { type: Number, default: 0 }
    },
    totalPrice: { type: Number, required: true },

    // Guest Contact Details
    guestName: { type: String },
    guestPhone: { type: String },
    guestEmail: { type: String },
    specialRequests: { type: String },
    bookingStatus: { 
        type: String, 
        enum: ['Pending', 'Confirmed', 'Expired', 'Cancelled', 'Checked-In', 'Checked-Out'], 
        default: 'Pending',
        required: true
    },
    paymentStatus: { 
        type: String, 
        enum: ['Pending', 'Completed', 'Failed', 'Refunded'], 
        default: 'Pending',
        required: true
    },
    
    // Razorpay Trace Metadata
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    paymentMethod: { type: String },
    transactionDate: { type: Date },
    
    // Legacy Payment ID mapping (backward compatibility)
    paymentIntentId: { type: String },
    
    // Refund Management
    refundStatus: { 
        type: String, 
        enum: ['None', 'Requested', 'Processing', 'Completed', 'Rejected'], 
        default: 'None' 
    },
    refundAmount: { type: Number },
    refundDate: { type: Date },
    refundReason: { type: String },
    refundId: { type: String },

    isCancelled: { type: Boolean, default: false },
    expiresAt: { type: Date }
}, { timestamps: true });

// Note: No TTL index here so that expired bookings are kept in database for analytics.

module.exports = mongoose.model('Booking', bookingSchema);
