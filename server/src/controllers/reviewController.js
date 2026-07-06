const Review = require('../models/Review');
const Room = require('../models/Room');

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
    const { rating, comment, room: roomId } = req.body;
    try {
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const alreadyReviewed = await Review.findOne({ user: req.user._id, room: roomId });
        if (alreadyReviewed) {
            return res.status(400).json({ message: 'Room already reviewed' });
        }

        const review = new Review({
            user: req.user._id,
            room: roomId,
            rating: Number(rating),
            comment,
            isApproved: false // Requires admin moderation
        });

        await review.save();
        res.status(201).json({ message: 'Review added and pending approval' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get reviews for a room
// @route   GET /api/reviews/room/:roomId
// @access  Public
const getRoomReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ room: req.params.roomId, isApproved: true }).populate('user', 'name');
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve/Reject review
// @route   PUT /api/reviews/:id/approve
// @access  Private/Admin
const approveReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (review) {
            review.isApproved = req.body.isApproved;
            await review.save();

            // Update room rating
            const room = await Room.findById(review.room);
            const reviews = await Review.find({ room: review.room, isApproved: true });
            room.numReviews = reviews.length;
            room.rating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length || 0;
            await room.save();

            res.json({ message: 'Review status updated' });
        } else {
            res.status(404).json({ message: 'Review not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all reviews (Admin)
// @route   GET /api/reviews
// @access  Private/Admin
const getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find({}).populate('user', 'name').populate('room', 'name');
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user's reviews
// @route   GET /api/reviews/my
// @access  Private
const getMyReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ user: req.user._id }).populate('room', 'name images');
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = async (req, res) => {
    try {
        const review = await Review.findOne({ 
            _id: req.params.id, 
            user: req.user._id 
        });
        
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        await review.deleteOne();
        res.json({ message: 'Review deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createReview, getRoomReviews, approveReview, getAllReviews, getMyReviews, deleteReview };
