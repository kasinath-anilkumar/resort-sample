const express = require('express');
const router = express.Router();
const { createReview, getRoomReviews, approveReview, getAllReviews, getMyReviews, deleteReview } = require('../controllers/reviewController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, admin, getAllReviews)
    .post(protect, createReview);

router.get('/myreviews', protect, getMyReviews);
router.get('/room/:roomId', getRoomReviews);
router.put('/:id/approve', protect, admin, approveReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
