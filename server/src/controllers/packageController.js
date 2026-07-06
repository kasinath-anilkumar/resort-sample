const Package = require('../models/Package');

// @desc    Create a new package
// @route   POST /api/packages
// @access  Private/Admin
const createPackage = async (req, res) => {
    try {
        const package_ = await Package.create(req.body);
        res.status(201).json(package_);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all packages
// @route   GET /api/packages
// @access  Public
const getPackages = async (req, res) => {
    try {
        const packages = await Package.find({ availability: true });
        res.json(packages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single package
// @route   GET /api/packages/:id
// @access  Public
const getPackageById = async (req, res) => {
    try {
        const package_ = await Package.findById(req.params.id);
        if (!package_) {
            return res.status(404).json({ message: 'Package not found' });
        }
        res.json(package_);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update package
// @route   PUT /api/packages/:id
// @access  Private/Admin
const updatePackage = async (req, res) => {
    try {
        const package_ = await Package.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!package_) {
            return res.status(404).json({ message: 'Package not found' });
        }
        res.json(package_);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete package
// @route   DELETE /api/packages/:id
// @access  Private/Admin
const deletePackage = async (req, res) => {
    try {
        const package_ = await Package.findByIdAndDelete(req.params.id);
        if (!package_) {
            return res.status(404).json({ message: 'Package not found' });
        }
        res.json({ message: 'Package deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createPackage,
    getPackages,
    getPackageById,
    updatePackage,
    deletePackage
};
