const Amenity = require('../models/Amenity');

// @desc    Get all amenities
// @route   GET /api/amenities
// @access  Public
const getAmenities = async (req, res) => {
    try {
        const amenities = await Amenity.find({}).sort({ name: 1 });
        res.json(amenities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create an amenity
// @route   POST /api/amenities
// @access  Private/Admin
const createAmenity = async (req, res) => {
    const { name, description, icon } = req.body;

    try {
        const exists = await Amenity.findOne({ name });
        if (exists) {
            return res.status(400).json({ message: 'Amenity already exists' });
        }

        const amenity = await Amenity.create({ name, description, icon });
        res.status(201).json(amenity);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update an amenity
// @route   PUT /api/amenities/:id
// @access  Private/Admin
const updateAmenity = async (req, res) => {
    const { name, description, icon } = req.body;

    try {
        const amenity = await Amenity.findById(req.params.id);
        if (!amenity) {
            return res.status(404).json({ message: 'Amenity not found' });
        }

        amenity.name = name || amenity.name;
        amenity.description = description !== undefined ? description : amenity.description;
        amenity.icon = icon !== undefined ? icon : amenity.icon;

        const updatedAmenity = await amenity.save();
        res.json(updatedAmenity);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete an amenity
// @route   DELETE /api/amenities/:id
// @access  Private/Admin
const deleteAmenity = async (req, res) => {
    try {
        const amenity = await Amenity.findById(req.params.id);
        if (!amenity) {
            return res.status(404).json({ message: 'Amenity not found' });
        }

        await amenity.deleteOne();
        res.json({ message: 'Amenity removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAmenities, createAmenity, updateAmenity, deleteAmenity };
