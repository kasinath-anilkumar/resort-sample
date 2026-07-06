const mongoose = require('mongoose');

const amenitySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    icon: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Amenity', amenitySchema);
