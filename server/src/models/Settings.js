const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    // Pricing & Charges
    gstPercent: { type: Number, default: 0 },
    serviceCharge: { type: Number, default: 0 },
    cleaningFee: { type: Number, default: 0 },
    childPrice: { type: Number, default: 0 },

    // Pricing Rules
    weekendMarkupPercent: { type: Number, default: 0 },
    minStayNights: { type: Number, default: 1 },
    maxStayNights: { type: Number, default: 30 },

    // Time-Based Charges
    earlyCheckInFee: { type: Number, default: 0 },
    lateCheckOutFee: { type: Number, default: 0 },

    // Payment Settings
    advancePercentage: { type: Number, default: 100 },
    allowPartialPayment: { type: Boolean, default: false },
    payAtProperty: { type: Boolean, default: true },

    // Booking Policies
    cancellationPolicy: { type: String, default: 'Free cancellation up to 24 hours before check-in.' },
    refundRules: { type: String, default: 'Refunds will be processed within 5-7 business days.' },
    bookingCutoffHours: { type: Number, default: 0 },

    // Room & Guest Rules
    childAgeLimit: { type: Number, default: 12 },

    // System Controls
    isGlobalApply: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
