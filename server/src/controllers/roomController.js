const Room = require('../models/Room');

const normalizeRoomCount = (value) => Math.max(1, Number(value) || 1);

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Public
const getRooms = async (req, res) => {
    try {
        const rooms = await Room.find({});
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get room by ID
// @route   GET /api/rooms/:id
// @access  Public
const getRoomById = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (room) {
            res.json(room);
        } else {
            res.status(404).json({ message: 'Room not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a room
// @route   POST /api/rooms
// @access  Private/Admin
const createRoom = async (req, res) => {
    const { name, type, description, pricePerNight, maxGuests, bedSize, roomSize, totalRooms, amenities, images, categorizedImages, allowExtraGuests, extraGuestLimit, extraGuestCharge } = req.body;
    try {
        const room = new Room({
            name,
            type,
            description,
            pricePerNight,
            maxGuests,
            bedSize,
            roomSize,
            totalRooms: normalizeRoomCount(totalRooms),
            amenities,
            images,
            categorizedImages: categorizedImages || { morningLight: [], roomDetails: [], outdoorCalm: [] },
            allowExtraGuests: allowExtraGuests !== false,
            extraGuestLimit: Math.max(0, Number(extraGuestLimit) || 0),
            extraGuestCharge: Math.max(0, Number(extraGuestCharge) || 0)
        });
        const createdRoom = await room.save();
        res.status(201).json(createdRoom);
    } catch (error) {
        console.error('Create Room Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a room
// @route   PUT /api/rooms/:id
// @access  Private/Admin
const updateRoom = async (req, res) => {
    const { name, type, description, pricePerNight, maxGuests, bedSize, roomSize, totalRooms, amenities, images, availability, categorizedImages, extraGuestLimit, extraGuestCharge } = req.body;
    try {
        const room = await Room.findById(req.params.id);
        if (room) {
            room.name = name || room.name;
            room.type = type || room.type;
            room.description = description || room.description;
            room.pricePerNight = pricePerNight !== undefined ? pricePerNight : room.pricePerNight;
            room.maxGuests = maxGuests !== undefined ? maxGuests : room.maxGuests;
            room.bedSize = bedSize || room.bedSize;
            room.roomSize = roomSize !== undefined ? roomSize : room.roomSize;
            room.totalRooms = totalRooms !== undefined ? normalizeRoomCount(totalRooms) : room.totalRooms;
            room.amenities = amenities || room.amenities;
            room.images = images || room.images;
            room.availability = availability !== undefined ? availability : room.availability;
            room.categorizedImages = categorizedImages || room.categorizedImages;
            room.allowExtraGuests = req.body.allowExtraGuests !== false;
            room.extraGuestLimit = extraGuestLimit !== undefined ? Math.max(0, Number(extraGuestLimit) || 0) : room.extraGuestLimit;
            room.extraGuestCharge = extraGuestCharge !== undefined ? Math.max(0, Number(extraGuestCharge) || 0) : room.extraGuestCharge;

            const updatedRoom = await room.save();
            res.json(updatedRoom);
        } else {
            res.status(404).json({ message: 'Room not found' });
        }
    } catch (error) {
        console.error('Update Room Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a room
// @route   DELETE /api/rooms/:id
// @access  Private/Admin
const deleteRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (room) {
            await room.deleteOne();
            res.json({ message: 'Room removed' });
        } else {
            res.status(404).json({ message: 'Room not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getRooms, getRoomById, createRoom, updateRoom, deleteRoom };
