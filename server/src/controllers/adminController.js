const Booking = require('../models/Booking');
const Room = require('../models/Room');
const User = require('../models/User');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
    try {
        const totalBookings = await Booking.countDocuments({});
        const rooms = await Room.find({}, 'totalRooms');
        const totalRooms = rooms.reduce((sum, room) => sum + (Number(room.totalRooms) || 1), 0);
        const totalUsers = await User.countDocuments({ isAdmin: false });

        const revenueData = await Booking.aggregate([
            { $match: { paymentStatus: 'Completed' } },
            { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } }
        ]);

        const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

        // Recently booked rooms
        const recentBookings = await Booking.find({}).sort({ createdAt: -1 }).limit(5).populate('user', 'name email').populate('room', 'name pricePerNight extraGuestCharge');

        // Bookings by Status
        const statusCounts = await Booking.aggregate([
            { $group: { _id: '$paymentStatus', count: { $sum: 1 } } }
        ]);
        const bookingsByStatus = { Pending: 0, Completed: 0, Cancelled: 0, Refunded: 0 };
        statusCounts.forEach(item => {
            if (item._id && bookingsByStatus[item._id] !== undefined) {
                bookingsByStatus[item._id] = item.count;
            }
        });

        // Monthly Trends (past 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const trends = await Booking.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    revenue: {
                        $sum: {
                            $cond: [{ $eq: ['$paymentStatus', 'Completed'] }, '$totalPrice', 0]
                        }
                    },
                    bookingsCount: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        const monthlyTrends = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const year = d.getFullYear();
            const month = d.getMonth() + 1;

            const matched = trends.find(t => t._id.year === year && t._id.month === month);
            monthlyTrends.push({
                label: d.toLocaleString('default', { month: 'short' }),
                revenue: matched ? matched.revenue : 0,
                bookings: matched ? matched.bookingsCount : 0
            });
        }

        // Room Performance
        const roomPerf = await Booking.aggregate([
            { $match: { paymentStatus: { $ne: 'Cancelled' } } },
            {
                $group: {
                    _id: '$room',
                    revenue: {
                        $sum: {
                            $cond: [{ $eq: ['$paymentStatus', 'Completed'] }, '$totalPrice', 0]
                        }
                    },
                    bookingsCount: { $sum: 1 }
                }
            },
            { $sort: { bookingsCount: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'rooms',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'roomDetails'
                }
            },
            { $unwind: '$roomDetails' }
        ]);

        const roomPerformance = roomPerf.map(item => ({
            name: item.roomDetails.name,
            revenue: item.revenue,
            bookings: item.bookingsCount
        }));

        // Average length of stay & ADR calculations
        const stayData = await Booking.find({ paymentStatus: { $ne: 'Cancelled' } }, 'checkInDate checkOutDate');
        let totalNights = 0;
        stayData.forEach(b => {
            const diffTime = Math.abs(b.checkOutDate - b.checkInDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            totalNights += diffDays;
        });
        const averageStayLength = stayData.length > 0 ? Number((totalNights / stayData.length).toFixed(1)) : 0;

        const completedStays = await Booking.find({ paymentStatus: 'Completed' }, 'checkInDate checkOutDate totalPrice');
        let completedNights = 0;
        let completedRevenue = 0;
        completedStays.forEach(b => {
            const diffTime = Math.abs(b.checkOutDate - b.checkInDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            completedNights += diffDays;
            completedRevenue += b.totalPrice;
        });
        const averageDailyRate = completedNights > 0 ? Math.round(completedRevenue / completedNights) : 0;

        const cancelledCount = bookingsByStatus.Cancelled || 0;
        const cancellationRate = totalBookings > 0 ? Number(((cancelledCount / totalBookings) * 100).toFixed(1)) : 0;

        res.json({
            totalBookings,
            totalRooms,
            totalUsers,
            totalRevenue,
            recentBookings,
            bookingsByStatus,
            monthlyTrends,
            roomPerformance,
            hospitalityMetrics: {
                averageStayLength,
                averageDailyRate,
                cancellationRate
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAdminStats };
