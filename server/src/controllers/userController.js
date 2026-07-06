const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validateMobileNumber } = require('../utils/validation');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone || '',
                isAdmin: user.isAdmin,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }
        const user = await User.create({ name, email, password });
        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone || '',
                isAdmin: user.isAdmin,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            isAdmin: user.isAdmin,
            avatar: user.avatar,
            wishlist: user.wishlist
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.avatar = req.body.avatar || user.avatar;

        if (req.body.phone !== undefined) {
            const phoneVal = req.body.phone.trim();
            if (phoneVal) {
                if (!validateMobileNumber(phoneVal)) {
                    res.status(400).json({ message: 'Phone number must start with a country code (e.g. +91) and be a valid mobile number' });
                    return;
                }
            }
            user.phone = phoneVal;
        }

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone || '',
            isAdmin: updatedUser.isAdmin,
            avatar: updatedUser.avatar,
            token: generateToken(updatedUser._id)
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            if (user.isAdmin) {
                res.status(400).json({ message: 'Cannot delete admin user' });
                return;
            }
            await user.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle room in wishlist
// @route   PUT /api/users/wishlist/:roomId
// @access  Private
const toggleWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const roomId = req.params.roomId;

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const wishlistIndex = user.wishlist.indexOf(roomId);
        if (wishlistIndex > -1) {
            // Remove from wishlist
            user.wishlist.splice(wishlistIndex, 1);
        } else {
            // Add to wishlist
            user.wishlist.push(roomId);
        }

        await user.save();
        res.json({ wishlist: user.wishlist });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user wishlist
// @route   GET /api/users/:id/wishlist
// @access  Private
const getUserWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('wishlist');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user.wishlist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { authUser, registerUser, getUserProfile, updateUserProfile, getUsers, deleteUser, toggleWishlist, getUserWishlist };
