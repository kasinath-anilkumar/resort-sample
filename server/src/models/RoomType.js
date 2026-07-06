const mongoose = require('mongoose');

const roomTypeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    amenities: [String]
}, { timestamps: true });

module.exports = mongoose.model('RoomType', roomTypeSchema);
