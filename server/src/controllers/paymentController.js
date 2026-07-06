const crypto = require('crypto');
const Booking = require('../models/Booking');
const { logBookingActivity } = require('../utils/activityLogger');

const getRazorpayAuthHeader = () => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        throw new Error('Razorpay credentials are not configured');
    }

    return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
};

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private
const createRazorpayOrder = async (req, res) => {
    const { bookingId } = req.body;

    try {
        const booking = await Booking.findById(bookingId).populate('room').populate('package');
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const currency = process.env.RAZORPAY_CURRENCY || 'INR';
        const amount = Math.round(Number(booking.totalPrice) * 100);

        const bookingName = booking.room?.name || booking.package?.name || 'Resort booking';

        const response = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                Authorization: getRazorpayAuthHeader(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount,
                currency,
                receipt: `booking_${booking._id}`,
                notes: {
                    bookingId: booking._id.toString(),
                    roomName: bookingName
                }
            })
        });

        const order = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                message: order.error?.description || 'Unable to create Razorpay order'
            });
        }

        res.json({
            key: process.env.RAZORPAY_KEY_ID,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            bookingId: booking._id,
            name: bookingName,
            description: `Booking from ${booking.checkInDate.toDateString()} to ${booking.checkOutDate.toDateString()}`
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify Razorpay payment
// @route   POST /api/payments/verify
// @access  Private
const verifyRazorpayPayment = async (req, res) => {
    const {
        bookingId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
    } = req.body;

    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: 'Payment verification failed' });
        }

        booking.bookingStatus = 'Confirmed';
        booking.paymentStatus = 'Completed';
        booking.razorpayOrderId = razorpay_order_id;
        booking.razorpayPaymentId = razorpay_payment_id;
        booking.razorpaySignature = razorpay_signature;
        booking.paymentIntentId = razorpay_payment_id;
        booking.paymentMethod = 'Razorpay';
        booking.transactionDate = new Date();
        booking.expiresAt = undefined; // Remove inventory lock
        await booking.save();

        // Log audit trail
        await logBookingActivity(booking._id, 'Payment Completed', req.user?.name || 'Customer', {
            razorpayPaymentId: razorpay_payment_id
        });
        await logBookingActivity(booking._id, 'Booking Confirmed', 'System');

        res.json({ message: 'Payment verified successfully', booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Process refund for booking
// @route   POST /api/payments/refund
// @access  Private/Admin
const processRefund = async (req, res) => {
    const { bookingId } = req.body;

    try {
        console.log('Processing refund for booking:', {
            bookingId,
            user: req.user ? { id: req.user._id, isAdmin: req.user.isAdmin } : 'No user'
        });

        const booking = await Booking.findById(bookingId).populate('user', 'name email').populate('room');
        if (!booking) {
            console.log('Booking not found:', bookingId);
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.paymentStatus !== 'Completed') {
            console.log('Booking payment not completed:', {
                bookingId,
                paymentStatus: booking.paymentStatus
            });
            return res.status(400).json({ message: 'Only completed payments can be refunded' });
        }

        if (!booking.paymentIntentId) {
            console.log('No payment ID found:', bookingId);
            return res.status(400).json({ message: 'Payment ID not found for this booking' });
        }

        // Process refund via Razorpay
        console.log('Calling Razorpay refund API for payment:', booking.paymentIntentId);
        const refundResponse = await fetch(`https://api.razorpay.com/v1/payments/${booking.paymentIntentId}/refund`, {
            method: 'POST',
            headers: {
                Authorization: getRazorpayAuthHeader(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: Math.round(Number(booking.totalPrice) * 100), // Full refund
                notes: {
                    bookingId: booking._id.toString(),
                    reason: 'Admin initiated refund'
                }
            })
        });

        const refundData = await refundResponse.json();
        console.log('Razorpay refund response:', {
            status: refundResponse.status,
            id: refundData.id,
            error: refundData.error
        });

        if (!refundResponse.ok) {
            console.log('Refund failed:', refundData.error);
            return res.status(refundResponse.status).json({
                message: refundData.error?.description || 'Refund processing failed'
            });
        }

        // Update booking status
        booking.bookingStatus = 'Cancelled';
        booking.paymentStatus = 'Refunded';
        booking.isCancelled = true;
        booking.refundStatus = 'Completed';
        booking.refundAmount = booking.totalPrice;
        booking.refundDate = new Date();
        booking.refundReason = 'Admin initiated refund';
        booking.refundId = refundData.id;
        
        const updatedBooking = await booking.save();

        // Log audit event
        await logBookingActivity(updatedBooking._id, 'Refund Issued', req.user?.name || 'Admin', {
            refundId: refundData.id,
            amount: booking.totalPrice
        });

        console.log('Refund processed successfully:', {
            bookingId: updatedBooking._id,
            refundId: refundData.id
        });

        res.json({
            success: true,
            message: 'Refund processed successfully',
            refundId: refundData.id,
            booking: updatedBooking
        });
    } catch (error) {
        console.error('Refund processing error:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Failed to process refund',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};

const getMyPaymentHistory = async (req, res) => {
    try {
        const bookings = await Booking.find({ 
            user: req.user._id,
            paymentStatus: { $in: ['Completed', 'Refunded'] }
        }).populate('room', 'name').sort({ createdAt: -1 });

        const paymentHistory = bookings.map(booking => ({
            id: booking._id,
            bookingId: booking._id,
            amount: booking.totalPrice,
            date: booking.createdAt,
            status: booking.paymentStatus,
            roomName: booking.room?.name || 'Room',
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate
        }));

        res.json(paymentHistory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Razorpay Webhook for payment events
// @route   POST /api/payments/webhook
// @access  Public
const handleRazorpayWebhook = async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.warn('Webhook: Razorpay secret not configured');
        return res.status(200).json({ message: 'Webhook secret is not configured' });
    }

    try {
        const shasum = crypto.createHmac('sha256', webhookSecret);
        shasum.update(JSON.stringify(req.body));
        const digest = shasum.digest('hex');

        if (digest !== signature) {
            console.warn('Webhook: Invalid signature received');
            return res.status(400).json({ message: 'Invalid webhook signature' });
        }

        const event = req.body.event;
        const payload = req.body.payload;

        if (event === 'payment.captured') {
            const payment = payload.payment.entity;
            const bookingId = payment.notes?.bookingId;

            if (bookingId) {
                const booking = await Booking.findById(bookingId);
                if (booking && booking.paymentStatus === 'Pending') {
                    booking.bookingStatus = 'Confirmed';
                    booking.paymentStatus = 'Completed';
                    booking.razorpayOrderId = payment.order_id;
                    booking.razorpayPaymentId = payment.id;
                    booking.razorpaySignature = signature;
                    booking.paymentIntentId = payment.id;
                    booking.paymentMethod = payment.method || 'Razorpay';
                    booking.transactionDate = new Date();
                    booking.expiresAt = undefined; // Confirm permanently, release TTL lock
                    await booking.save();

                    // Log audit trail
                    await logBookingActivity(booking._id, 'Payment Completed', 'System', {
                        razorpayPaymentId: payment.id,
                        channel: 'Webhook'
                    });
                    await logBookingActivity(booking._id, 'Booking Confirmed', 'System');

                    console.log(`Webhook: Booking ${bookingId} confirmed successfully via webhook.`);
                }
            }
        } else if (event === 'payment.failed') {
            const payment = payload.payment.entity;
            const bookingId = payment.notes?.bookingId;

            if (bookingId) {
                const booking = await Booking.findById(bookingId);
                if (booking && booking.paymentStatus === 'Pending') {
                    booking.bookingStatus = 'Cancelled';
                    booking.paymentStatus = 'Failed';
                    booking.isCancelled = true;
                    booking.expiresAt = undefined; // Clear expiration lock
                    booking.razorpayOrderId = payment.order_id;
                    booking.razorpayPaymentId = payment.id;
                    booking.paymentMethod = payment.method || 'Razorpay';
                    await booking.save();

                    // Log audit trail
                    await logBookingActivity(booking._id, 'Booking Cancelled', 'System', {
                        reason: 'Payment failed'
                    });

                    console.log(`Webhook: Booking ${bookingId} marked as failed/cancelled via webhook.`);
                }
            }
        }

        res.json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook: Webhook processing failed:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { 
    createRazorpayOrder, 
    verifyRazorpayPayment, 
    processRefund, 
    getMyPaymentHistory,
    handleRazorpayWebhook
};
