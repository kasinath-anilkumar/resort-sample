const express = require('express');
const router = express.Router();
const { getAmenities, createAmenity, updateAmenity, deleteAmenity } = require('../controllers/amenityController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(getAmenities)
    .post(protect, admin, createAmenity);

router.route('/:id')
    .put(protect, admin, updateAmenity)
    .delete(protect, admin, deleteAmenity);

module.exports = router;
