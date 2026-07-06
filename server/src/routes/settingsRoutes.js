const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { protect, admin } = require('../middleware/authMiddleware');

// Get settings
router.get('/', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({});
        }
        if (settings.isGlobalApply !== true || settings.isActive !== true) {
            settings.isGlobalApply = true;
            settings.isActive = true;
            await settings.save();
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update settings (Admin only)
router.put('/', protect, admin, async (req, res) => {
    try {
        const payload = { ...req.body, isGlobalApply: true, isActive: true };
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings(payload);
        } else {
            Object.assign(settings, payload);
        }
        await settings.save();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
