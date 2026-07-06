const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true },
    description: { type: String, required: true },
    pricePerNight: { type: Number, required: true },
    maxGuests: { type: Number, required: true },
    bedSize: { type: String, default: 'King' },
    roomSize: { type: Number, default: 400 },
    totalRooms: { type: Number, required: true, default: 1, min: 1 },
    allowExtraGuests: { type: Boolean, default: true },
    extraGuestLimit: { type: Number, default: 0, min: 0 },
    extraGuestCharge: { type: Number, default: 0, min: 0 },
    maxChildren: { type: Number, default: 2, min: 0 },
    amenities: [String],
    images: [String],
    categorizedImages: {
        morningLight: [String],
        roomDetails: [String],
        outdoorCalm: [String]
    },
    availability: { type: Boolean, default: true },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    seasonalPricing: [{
        season: String,
        price: Number,
        startDate: Date,
        endDate: Date
    }]
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
