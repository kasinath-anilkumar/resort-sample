const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide a package name'],
            trim: true,
            maxlength: 100
        },
        description: {
            type: String,
            required: [true, 'Please provide a package description']
        },
        price: {
            type: Number,
            required: [true, 'Please provide a package price']
        },
        duration: {
            type: String,
            required: [true, 'Please provide package duration (e.g., 3 days, 1 week)'],
            trim: true
        },
        image: {
            type: String,
            default: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1000&q=80'
        },
        highlights: {
            type: [String],
            default: []
        },
        amenities: {
            type: [String],
            default: []
        },
        capacity: {
            type: Number,
            default: 1
        },
        availability: {
            type: Boolean,
            default: true
        },
        discount: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Package', packageSchema);
