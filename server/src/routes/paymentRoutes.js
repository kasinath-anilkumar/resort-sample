const express = require('express');
const router = express.Router();
const { 
    createRazorpayOrder, 
    verifyRazorpayPayment, 
    processRefund, 
    getMyPaymentHistory,
    handleRazorpayWebhook
} = require('../controllers/paymentController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify', protect, verifyRazorpayPayment);
router.post('/refund', protect, admin, processRefund);
router.get('/myhistory', protect, getMyPaymentHistory);
router.post('/webhook', handleRazorpayWebhook);

module.exports = router;
