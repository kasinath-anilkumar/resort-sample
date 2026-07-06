const express = require('express');
const router = express.Router();
const {
    createPackage,
    getPackages,
    getPackageById,
    updatePackage,
    deletePackage
} = require('../controllers/packageController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getPackages);
router.get('/:id', getPackageById);

// Admin routes
router.post('/', protect, admin, createPackage);
router.put('/:id', protect, admin, updatePackage);
router.delete('/:id', protect, admin, deletePackage);

module.exports = router;
