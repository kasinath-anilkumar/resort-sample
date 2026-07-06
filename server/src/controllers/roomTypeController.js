const RoomType = require('../models/RoomType');

const normalizeAmenities = (amenities) => {
    if (Array.isArray(amenities)) {
        return amenities.map((item) => String(item).trim()).filter(Boolean);
    }

    if (typeof amenities === 'string') {
        return amenities.split(',').map((item) => item.trim()).filter(Boolean);
    }

    return [];
};

// @desc    Get all room types
// @route   GET /api/room-types
// @access  Public
const getRoomTypes = async (req, res) => {
    try {
        const roomTypes = await RoomType.find({});
        res.json(roomTypes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a room type
// @route   POST /api/room-types
// @access  Private/Admin
const createRoomType = async (req, res) => {
    try {
        const { name, description, amenities } = req.body;
        const exists = await RoomType.findOne({ name });
        if (exists) return res.status(400).json({ message: 'Room type already exists' });

        const roomType = await RoomType.create({ name, description, amenities: normalizeAmenities(amenities) });
        res.status(201).json(roomType);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update room type
// @route   PUT /api/room-types/:id
// @access  Private/Admin
const updateRoomType = async (req, res) => {
    try {
        const roomType = await RoomType.findById(req.params.id);
        if (roomType) {
            roomType.name = req.body.name || roomType.name;
            roomType.description = req.body.description || roomType.description;
            roomType.amenities = req.body.amenities !== undefined ? normalizeAmenities(req.body.amenities) : roomType.amenities;
            const updated = await roomType.save();
            res.json(updated);
        } else {
            res.status(404).json({ message: 'Room type not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete room type
// @route   DELETE /api/room-types/:id
// @access  Private/Admin
const deleteRoomType = async (req, res) => {
    try {
        const roomType = await RoomType.findById(req.params.id);
        if (roomType) {
            await roomType.deleteOne();
            res.json({ message: 'Room type removed' });
        } else {
            res.status(404).json({ message: 'Room type not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getRoomTypes, createRoomType, updateRoomType, deleteRoomType };
