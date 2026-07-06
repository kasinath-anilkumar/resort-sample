const express = require('express');
const router = express.Router();
const { getRoomTypes, createRoomType, updateRoomType, deleteRoomType } = require('../controllers/roomTypeController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(getRoomTypes)
    .post(protect, admin, createRoomType);

router.route('/:id')
    .put(protect, admin, updateRoomType)
    .delete(protect, admin, deleteRoomType);

module.exports = router;
