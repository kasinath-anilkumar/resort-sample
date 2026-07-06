const express = require('express');
const router = express.Router();
const { authUser, registerUser, getUserProfile, updateUserProfile, getUsers, deleteUser, toggleWishlist, getUserWishlist } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .post(registerUser)
    .get(protect, admin, getUsers);

router.post('/login', authUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.post('/wishlist/:roomId', protect, toggleWishlist);
router.get('/:id/wishlist', protect, getUserWishlist);
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;
