const express = require('express');
const router = express.Router();
const { upload } = require('../utils/cloudinary');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, admin, upload.any(), (req, res) => {
    const urls = req.files.map(file => file.path);
    res.json({ urls });
});

module.exports = router;
