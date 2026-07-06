const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Settings = require('../models/Settings');
const { logBookingActivity } = require('../utils/activityLogger');
const { validateMobileNumber } = require('../utils/validation');

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const startOfDay = (date) => {
    const cleanDate = new Date(date);
    cleanDate.setHours(0, 0, 0, 0);
    return cleanDate;
};

const addDays = (date, days) => {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
};

const getNightlyRate = (room, date) => {
    const night = startOfDay(date);
    const seasonalRate = room.seasonalPricing?.find((season) => {
        if (!season.startDate || !season.endDate || !season.price) return false;
        const start = startOfDay(season.startDate);
        const end = startOfDay(season.endDate);
        return night >= start && night <= end;
    });

    return Number(seasonalRate?.price || room.pricePerNight || 0);
};

const calculateTotalPrice = async (room, checkInDate, checkOutDate, guests = { adults: 1, children: 0 }, addOns = { earlyCheckIn: false, lateCheckOut: false }) => {
    const checkIn = startOfDay(checkInDate);
    const checkOut = startOfDay(checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / MS_PER_DAY);

    let settings = await Settings.findOne();
    if (!settings) {
        settings = { 
            gstPercent: 0, serviceCharge: 0, cleaningFee: 0, childPrice: 0,
            minStayNights: 1, maxStayNights: 30, earlyCheckInFee: 0, lateCheckOutFee: 0,
            isActive: false, isGlobalApply: false
        };
    }

    if (nights <= 0) {
        return { isValid: false, message: 'Check-out must be after check-in', nights: 0, totalPrice: 0 };
    }

    if (settings.isActive && settings.isGlobalApply) {
        if (nights < settings.minStayNights) return { isValid: false, message: `Minimum stay is ${settings.minStayNights} nights.` };
        if (nights > settings.maxStayNights) return { isValid: false, message: `Maximum stay is ${settings.maxStayNights} nights.` };
    }

    const subtotal = Array.from({ length: nights }, (_, index) => {
        const date = addDays(checkIn, index);
        // Weekend markup logic inside getNightlyRate or here. 
        // For simplicity, applying weekend markup globally here if it's weekend (Fri-Sat or Sat-Sun)
        let rate = getNightlyRate(room, date);
        const dayOfWeek = date.getDay();
        if (settings.isActive && settings.weekendMarkupPercent > 0 && (dayOfWeek === 5 || dayOfWeek === 6)) {
            rate += rate * (settings.weekendMarkupPercent / 100);
        }
        return rate;
    }).reduce((sum, rate) => sum + rate, 0);

    let cleaningFee = settings.isActive ? settings.cleaningFee : 0;
    let serviceCharge = settings.isActive ? settings.serviceCharge : 0;
    let extraGuestFee = 0;
    let childFee = 0;
    let earlyCheckInFee = (settings.isActive && addOns.earlyCheckIn) ? settings.earlyCheckInFee : 0;
    let lateCheckOutFee = (settings.isActive && addOns.lateCheckOut) ? settings.lateCheckOutFee : 0;

    const adultsCount = Number(guests.adults) || 1;
    const extraAdultsCount = Number(guests.extraAdults) || 0;
    const children = Number(guests.children) || 0;
    const roomExtraGuestCharge = Math.max(0, Number(room.extraGuestCharge) || 0);
    const roomExtraGuestLimit = Math.max(0, Number(room.extraGuestLimit) || 0);

    // Capacity check: adults (base + extra)
    const maxAdultsAllowed = (room.maxGuests || 0) + roomExtraGuestLimit;
    if (adultsCount + extraAdultsCount > maxAdultsAllowed) {
        return { isValid: false, message: `Maximum ${maxAdultsAllowed} adults allowed.` };
    }

    // Capacity check: children (separate limit)
    const maxChildrenAllowed = room.maxChildren !== undefined ? Math.max(0, Number(room.maxChildren)) : 2;
    if (children > maxChildrenAllowed) {
        return { isValid: false, message: `Maximum ${maxChildrenAllowed} children allowed.` };
    }

    if (extraAdultsCount > 0) {
        extraGuestFee = extraAdultsCount * roomExtraGuestCharge * nights;
    }
    
    // Children are free — no child fee
    childFee = 0;

    const preTaxTotal = subtotal + cleaningFee + serviceCharge + extraGuestFee + childFee + earlyCheckInFee + lateCheckOutFee;
    const tax = settings.isActive ? (preTaxTotal * (settings.gstPercent / 100)) : 0;

    return { 
        isValid: true,
        nights, 
        subtotal, 
        cleaningFee,
        serviceCharge,
        extraGuestFee,
        childFee,
        earlyCheckInFee,
        lateCheckOutFee,
        tax,
        totalPrice: preTaxTotal + tax 
    };
};

const getOverlappingBookings = (roomId, checkInDate, checkOutDate) => {
    const checkIn = startOfDay(checkInDate);
    const checkOut = startOfDay(checkOutDate);
    return Booking.find({
        room: roomId,
        bookingStatus: { $in: ['Pending', 'Confirmed', 'Checked-In'] },
        $or: [
            { checkInDate: { $lt: checkOut, $gte: checkIn } },
            { checkOutDate: { $gt: checkIn, $lte: checkOut } },
            { checkInDate: { $lte: checkIn }, checkOutDate: { $gte: checkOut } }
        ]
    });
};

const calculateAvailability = async (room, roomId, checkInDate, checkOutDate) => {
    const checkIn = startOfDay(checkInDate);
    const checkOut = startOfDay(checkOutDate);
    const overlappingBookings = await getOverlappingBookings(roomId, checkIn, checkOut);
    const totalRooms = Math.max(1, Number(room.totalRooms) || 1);
    const bookedRooms = overlappingBookings.reduce((sum, b) => sum + (b.roomsBooked || 1), 0);

    return {
        totalRooms,
        bookedRooms,
        availableRooms: Math.max(0, totalRooms - bookedRooms)
    };
};

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
    const { 
        room: roomId, 
        package: packageId,
        checkInDate, 
        checkOutDate, 
        guests, 
        addOns, 
        payAtProperty, 
        guestName, 
        guestPhone, 
        guestEmail, 
        specialRequests, 
        roomsBooked 
    } = req.body;

    try {
        if (!guestPhone || !validateMobileNumber(guestPhone)) {
            return res.status(400).json({ message: 'Phone number must start with a country code (e.g. +91) and be a valid mobile number' });
        }
        if (packageId) {
            const PackageModel = require('../models/Package');
            const package_ = await PackageModel.findById(packageId);
            if (!package_) {
                return res.status(404).json({ message: 'Package not found' });
            }
            if (!package_.availability) {
                return res.status(400).json({ message: 'This package is not available' });
            }

            const cleanCheckIn = startOfDay(checkInDate);
            
            // Calculate check-out date from package duration
            let nights = 1;
            const durationStr = package_.duration.toLowerCase();
            const nightMatch = durationStr.match(/(\d+)\s*night/);
            if (nightMatch) {
                nights = parseInt(nightMatch[1]);
            } else {
                const dayMatch = durationStr.match(/(\d+)\s*day/);
                if (dayMatch) {
                    nights = Math.max(1, parseInt(dayMatch[1]) - 1);
                }
            }
            
            const cleanCheckOut = new Date(cleanCheckIn.getTime() + nights * 24 * 60 * 60 * 1000);
            const requestedRooms = Math.max(1, Number(roomsBooked) || 1);
            const discountPercent = Number(package_.discount) || 0;
            const discountedPrice = Math.round(package_.price * (1 - discountPercent / 100));
            const finalPrice = discountedPrice * requestedRooms;

            const booking = new Booking({
                user: req.user._id,
                package: packageId,
                roomsBooked: requestedRooms,
                checkInDate: cleanCheckIn,
                checkOutDate: cleanCheckOut,
                guests: guests || { adults: 1, children: 0 },
                guestName,
                guestPhone,
                guestEmail,
                specialRequests,
                totalPrice: finalPrice,
                bookingStatus: payAtProperty ? 'Confirmed' : 'Pending',
                paymentStatus: 'Pending',
                paymentMethod: payAtProperty ? 'Pay at Property' : undefined,
                expiresAt: payAtProperty ? undefined : new Date(Date.now() + 15 * 60 * 1000)
            });

            const createdBooking = await booking.save();

            // Write Audit Log
            await logBookingActivity(createdBooking._id, 'Booking Created', req.user?.name || 'Customer', {
                package: package_.name,
                roomsBooked: createdBooking.roomsBooked,
                totalPrice: createdBooking.totalPrice
            });

            return res.status(201).json(createdBooking);
        }

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }
        if (!room.availability) {
            return res.status(400).json({ message: 'This room is not available for booking' });
        }

        const cleanCheckIn = startOfDay(checkInDate);
        const cleanCheckOut = startOfDay(checkOutDate);

        const pricing = await calculateTotalPrice(room, cleanCheckIn, cleanCheckOut, guests, addOns);
        if (!pricing.isValid) {
            return res.status(400).json({ message: pricing.message });
        }
        if (!Number.isFinite(pricing.totalPrice) || pricing.totalPrice <= 0) {
            return res.status(400).json({ message: 'Unable to calculate booking total' });
        }

        const availability = room.availability
            ? await calculateAvailability(room, roomId, cleanCheckIn, cleanCheckOut)
            : { totalRooms: Math.max(1, Number(room.totalRooms) || 1), bookedRooms: 0, availableRooms: 0 };
        
        const requestedRooms = Math.max(1, Number(roomsBooked) || 1);
        if (availability.availableRooms < requestedRooms) {
            return res.status(400).json({ message: `Insufficient rooms available. Only ${availability.availableRooms} rooms remaining.` });
        }

        const finalPrice = pricing.totalPrice * requestedRooms;

        const booking = new Booking({
            user: req.user._id,
            room: roomId,
            roomsBooked: requestedRooms,
            checkInDate: cleanCheckIn,
            checkOutDate: cleanCheckOut,
            guests,
            guestName,
            guestPhone,
            guestEmail,
            specialRequests,
            totalPrice: finalPrice,
            bookingStatus: payAtProperty ? 'Confirmed' : 'Pending',
            paymentStatus: 'Pending',
            paymentMethod: payAtProperty ? 'Pay at Property' : undefined,
            expiresAt: payAtProperty ? undefined : new Date(Date.now() + 15 * 60 * 1000)
        });

        const createdBooking = await booking.save();

        // Write Audit Log
        await logBookingActivity(createdBooking._id, 'Booking Created', req.user?.name || 'Customer', {
            room: room.name,
            roomsBooked: createdBooking.roomsBooked,
            totalPrice: createdBooking.totalPrice
        });

        res.status(201).json(createdBooking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Check room availability for selected dates
// @route   POST /api/bookings/availability
// @access  Public
const checkAvailability = async (req, res) => {
    const { room: roomId, checkInDate, checkOutDate, guests, addOns, roomsBooked } = req.body;

    try {
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const cleanCheckIn = startOfDay(checkInDate);
        const cleanCheckOut = startOfDay(checkOutDate);

        const pricing = await calculateTotalPrice(room, cleanCheckIn, cleanCheckOut, guests || { adults: 1, children: 0 }, addOns);
        if (!pricing.isValid) {
            return res.status(400).json({ message: pricing.message });
        }

        const availability = room.availability
            ? await calculateAvailability(room, roomId, cleanCheckIn, cleanCheckOut)
            : { totalRooms: Math.max(1, Number(room.totalRooms) || 1), bookedRooms: 0, availableRooms: 0 };
        
        const requestedRooms = Math.max(1, Number(roomsBooked) || 1);
        const finalPrice = pricing.totalPrice * requestedRooms;

        res.json({
            ...availability,
            nights: pricing.nights,
            totalPrice: finalPrice
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('user', 'name email').populate('room').populate('package');
        if (booking) {
            if (booking.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
                return res.status(401).json({ message: 'Not authorized' });
            }
            res.json(booking);
        } else {
            res.status(404).json({ message: 'Booking not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update booking to paid (simulated for now, Stripe later)
// @route   PUT /api/bookings/:id/pay
// @access  Private
const updateBookingToPaid = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (booking) {
            booking.paymentStatus = 'Completed';
            booking.paymentIntentId = req.body.id;
            const updatedBooking = await booking.save();
            res.json(updatedBooking);
        } else {
            res.status(404).json({ message: 'Booking not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged in user bookings
// @route   GET /api/bookings/mybookings
// @access  Private
const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id }).populate('room').populate('package');
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all bookings (Admin)
// @route   GET /api/bookings
// @access  Private/Admin
const getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({}).populate('user', 'name email').populate('room').populate('package');
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cancel booking (Admin)
// @route   PUT /api/bookings/:id/cancel
// @access  Private/Admin
const cancelBooking = async (req, res) => {
    try {
        console.log('Cancel booking request:', {
            bookingId: req.params.id,
            user: req.user ? { id: req.user._id, isAdmin: req.user.isAdmin } : 'No user'
        });

        const booking = await Booking.findById(req.params.id).populate('user', 'name email').populate('room').populate('package');
        if (!booking) {
            console.log('Booking not found:', req.params.id);
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.isCancelled) {
            console.log('Booking already cancelled:', booking._id);
            return res.status(400).json({ message: 'Booking is already cancelled' });
        }

        booking.isCancelled = true;
        booking.bookingStatus = 'Cancelled';
        if (booking.paymentStatus === 'Pending') {
            booking.paymentStatus = 'Failed';
        }
        
        const updatedBooking = await booking.save();
        
        // Write Audit Log
        await logBookingActivity(updatedBooking._id, 'Booking Cancelled', req.user?.name || 'Admin');

        console.log('Booking cancelled successfully:', {
            id: updatedBooking._id,
            bookingStatus: updatedBooking.bookingStatus,
            paymentStatus: updatedBooking.paymentStatus
        });
 
        res.json({ 
            success: true,
            message: 'Booking cancelled successfully',
            booking: updatedBooking 
        });
    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Failed to cancel booking',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};

// @desc    Check in guest (Admin)
// @route   PUT /api/bookings/:id/checkin
// @access  Private/Admin
const checkInBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        booking.bookingStatus = 'Checked-In';
        const updatedBooking = await booking.save();

        // Write Audit Log
        await logBookingActivity(updatedBooking._id, 'Check-In', req.user?.name || 'Admin');

        res.json({ success: true, message: 'Guest checked in successfully', booking: updatedBooking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Check out guest (Admin)
// @route   PUT /api/bookings/:id/checkout
// @access  Private/Admin
const checkOutBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        booking.bookingStatus = 'Checked-Out';
        const updatedBooking = await booking.save();

        // Write Audit Log
        await logBookingActivity(updatedBooking._id, 'Check-Out', req.user?.name || 'Admin');

        res.json({ success: true, message: 'Guest checked out successfully', booking: updatedBooking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { 
    createBooking, 
    checkAvailability, 
    getBookingById, 
    updateBookingToPaid, 
    getMyBookings, 
    getBookings, 
    cancelBooking,
    checkInBooking,
    checkOutBooking
};
