import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeft,
    BedDouble,
    Calendar,
    Check,
    ChevronLeft,
    ChevronRight,
    Clock,
    Coffee,
    Heart,
    Loader2,
    MapPin,
    Minus,
    Plus,
    Ruler,
    Shield,
    Star,
    Tv,
    Users,
    Wifi,
    Wind,
    X
} from 'lucide-react';
import { useContext, useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../api';
import { RoomDetailsSkeleton } from '../components/LoadingSkeleton';
import { AuthContext } from '../context/AuthContext';
import { cachedGet } from '../utils/cache';
import { validateMobileNumber } from '../utils/validation';
import PhoneInput from '../components/PhoneInput';

const fallbackImage = 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1600&q=80';
const razorpayCheckoutUrl = 'https://checkout.razorpay.com/v1/checkout.js';

const amenityIcons = {
    Wifi: <Wifi size={16} />,
    WiFi: <Wifi size={16} />,
    AC: <Wind size={16} />,
    'Air Conditioning': <Wind size={16} />,
    Spa: <Heart size={16} />,
    Parking: <Shield size={16} />,
    Pool: <Wind size={16} />,
    Breakfast: <Coffee size={16} />,
    TV: <Tv size={16} />,
    'Smart TV': <Tv size={16} />,
    Bathtub: <Heart size={16} />,
    Shower: <Star size={16} />,
    'Rain Shower': <Star size={16} />,
    'Mini Bar': <Coffee size={16} />,
    'Private Deck': <MapPin size={16} />
};

const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-US')}`;

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
    const seasonalRate = room?.seasonalPricing?.find((season) => {
        if (!season.startDate || !season.endDate || !season.price) return false;
        const start = startOfDay(season.startDate);
        const end = startOfDay(season.endDate);
        return night >= start && night <= end;
    });

    return Number(seasonalRate?.price || room?.pricePerNight || 0);
};

const calculateRoomPricing = (room, checkIn, checkOut, settings = {}, guests = { adults: 1, children: 0, extraAdults: 0 }, addOns = { earlyCheckIn: false, lateCheckOut: false }, roomExtraGuestLimit = 0) => {
    if (!room || !checkIn || !checkOut || checkOut <= checkIn) {
        return {
            isValid: false,
            nights: 0,
            nightlyRates: [],
            subtotal: 0,
            cleaningFee: 0,
            serviceCharge: 0,
            extraGuestFee: 0,
            childFee: 0,
            earlyCheckInFee: 0,
            lateCheckOutFee: 0,
            tax: 0,
            totalPrice: Number(room?.pricePerNight || 0) + (settings.cleaningFee || 0) + (settings.serviceCharge || 0),
            averageNightlyRate: Number(room?.pricePerNight || 0)
        };
    }

    const nights = Math.ceil((startOfDay(checkOut) - startOfDay(checkIn)) / (1000 * 60 * 60 * 24));

    if (settings.isActive && settings.isGlobalApply) {
        if (nights < (settings.minStayNights || 1)) return { isValid: false, message: `Minimum stay is ${settings.minStayNights} nights.` };
        if (nights > (settings.maxStayNights || 30)) return { isValid: false, message: `Maximum stay is ${settings.maxStayNights} nights.` };
    }

    const nightlyRates = Array.from({ length: nights }, (_, index) => {
        const date = addDays(startOfDay(checkIn), index);
        let rate = getNightlyRate(room, date);
        const dayOfWeek = date.getDay();
        if (settings.isActive && settings.weekendMarkupPercent > 0 && (dayOfWeek === 5 || date.getDay() === 6)) {
            rate += rate * (settings.weekendMarkupPercent / 100);
        }
        return { date, rate };
    });

    const subtotal = nightlyRates.reduce((sum, item) => sum + item.rate, 0);

    let cleaningFee = settings.isActive ? (settings.cleaningFee || 0) : 0;
    let serviceCharge = settings.isActive ? (settings.serviceCharge || 0) : 0;
    let extraGuestFee = 0;
    let childFee = 0;
    let earlyCheckInFee = (settings.isActive && addOns.earlyCheckIn) ? (settings.earlyCheckInFee || 0) : 0;
    let lateCheckOutFee = (settings.isActive && addOns.lateCheckOut) ? (settings.lateCheckOutFee || 0) : 0;

    const adultsCount = Number(guests.adults) || 1;
    const extraAdultsCount = Number(guests.extraAdults) || 0;
    const totalAdults = adultsCount + extraAdultsCount;
    const roomExtraGuestCharge = Math.max(0, Number(room?.extraGuestCharge) || 0);

    // Capacity check: only adults count toward capacity (children are free and separate)
    const maxAdultsAllowed = (room?.maxGuests || 0) + (Number(roomExtraGuestLimit) || 0);
    if (totalAdults > maxAdultsAllowed) {
        return { isValid: false, message: `Maximum ${maxAdultsAllowed} adults allowed.` };
    }

    if ((Number(roomExtraGuestLimit) || 0) > 0 && extraAdultsCount > 0) {
        extraGuestFee = extraAdultsCount * roomExtraGuestCharge * nights;
    }
    // Children are free — no child fee
    const preTaxTotal = subtotal + cleaningFee + serviceCharge + extraGuestFee + earlyCheckInFee + lateCheckOutFee;
    const tax = settings.isActive ? preTaxTotal * ((settings.gstPercent || 0) / 100) : 0;

    return {
        isValid: true,
        nights,
        nightlyRates,
        subtotal,
        cleaningFee,
        serviceCharge,
        extraGuestFee,
        childFee,
        earlyCheckInFee,
        lateCheckOutFee,
        tax,
        totalPrice: preTaxTotal + tax,
        averageNightlyRate: nights ? Math.round(subtotal / nights) : Number(room.pricePerNight || 0)
    };
};

const loadRazorpayCheckout = () => (
    new Promise((resolve, reject) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const existingScript = document.querySelector(`script[src="${razorpayCheckoutUrl}"]`);
        if (existingScript) {
            existingScript.addEventListener('load', () => resolve(true), { once: true });
            existingScript.addEventListener('error', () => reject(new Error('Unable to load Razorpay checkout')), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = razorpayCheckoutUrl;
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error('Unable to load Razorpay checkout'));
        document.body.appendChild(script);
    })
);

const RoomDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [room, setRoom] = useState(null);
    const [roomTypes, setRoomTypes] = useState([]);
    const [selectedImage, setSelectedImage] = useState('');
    const [relatedRooms, setRelatedRooms] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [checkIn, setCheckIn] = useState(null);
    const [checkOut, setCheckOut] = useState(null);
    const [guests, setGuests] = useState({ adults: 1, extraAdults: 0, children: 0 });
    const [showExtraGuests, setShowExtraGuests] = useState(false);
    const [addOns, setAddOns] = useState({ earlyCheckIn: false, lateCheckOut: false });
    const [paymentMethod, setPaymentMethod] = useState('online');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [lightbox, setLightbox] = useState({ isOpen: false, images: [], index: 0 });
    const [availability, setAvailability] = useState(null);
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showAllAmenities, setShowAllAmenities] = useState(false);
    const [isBookingSheetOpen, setIsBookingSheetOpen] = useState(false);
    const [resortSettings, setResortSettings] = useState({ taxAmount: 0 });
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [checkoutStep, setCheckoutStep] = useState(1);
    const [guestName, setGuestName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [guestPhone, setGuestPhone] = useState('');
    const [specialRequests, setSpecialRequests] = useState('');

    useEffect(() => {
        if (!showConfirmation) {
            setCheckoutStep(1);
        }
    }, [showConfirmation]);

    useEffect(() => {
        if (user) {
            setGuestName(user.name || '');
            setGuestEmail(user.email || '');
            setGuestPhone(user.phone || '');
        }
    }, [user]);

    // Only adults count toward capacity; children are free and have a separate limit
    const totalAdultGuests = guests.adults + (showExtraGuests ? guests.extraAdults : 0);

    const images = useMemo(() => {
        const roomImages = room?.images?.filter(Boolean) || [];
        return roomImages.length ? roomImages : [fallbackImage];
    }, [room]);

    const amenities = useMemo(() => {
        const roomAmenities = room?.amenities?.filter(Boolean) || [];
        const categoryAmenities = roomTypes.find((type) => type.name === room?.type)?.amenities?.filter(Boolean) || [];
        return roomAmenities.length
            ? roomAmenities
            : categoryAmenities.length
                ? categoryAmenities
                : ['Wifi', 'Air Conditioning', 'Smart TV', 'Breakfast', 'Rain Shower', 'Private Deck'];
    }, [room, roomTypes]);

    const categorizedSections = useMemo(() => {
        const cats = room?.categorizedImages || {};
        return [
            { id: 'morningLight', label: 'Morning light', images: cats.morningLight?.length ? cats.morningLight : [images[0]] },
            { id: 'roomDetails', label: 'Room details', images: cats.roomDetails?.length ? cats.roomDetails : [images[1] || images[0]] },
            { id: 'outdoorCalm', label: 'Outdoor calm', images: cats.outdoorCalm?.length ? cats.outdoorCalm : [images[2] || images[0]] }
        ];
    }, [room, images]);

    const normalizedGuests = useMemo(
        () => ({
            ...guests,
            extraAdults: showExtraGuests ? (Number(guests.extraAdults) || 0) : 0
        }),
        [guests, showExtraGuests]
    );
    const roomExtraGuestLimit = Math.max(0, Number(room?.extraGuestLimit) || 0);

    const pricing = useMemo(
        () => calculateRoomPricing(room, checkIn, checkOut, resortSettings, normalizedGuests, addOns, roomExtraGuestLimit),
        [room, checkIn, checkOut, resortSettings, normalizedGuests, addOns, roomExtraGuestLimit]
    );

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const lightboxNext = () => {
        setLightbox(prev => ({
            ...prev,
            index: (prev.index + 1) % prev.images.length
        }));
    };

    const lightboxPrev = () => {
        setLightbox(prev => ({
            ...prev,
            index: (prev.index - 1 + prev.images.length) % prev.images.length
        }));
    };

    useEffect(() => {
        if (images.length <= 1) return;
        const interval = setInterval(nextImage, 6000);
        return () => clearInterval(interval);
    }, [images.length]);

    useEffect(() => {
        const fetchRoom = async () => {
            setLoading(true);
            try {
                const { data } = await API.get(`/rooms/${id}`);
                setRoom(data);
                setSelectedImage(data.images?.[0] || fallbackImage);

                const allRooms = await cachedGet('/rooms');
                const sameType = allRooms.filter((item) => item._id !== id && item.type === data.type);
                const otherTypes = allRooms.filter((item) => item._id !== id && item.type !== data.type);
                const recommended = [...sameType, ...otherTypes].slice(0, 3);
                setRelatedRooms(recommended);

                const types = await cachedGet('/room-types');
                setRoomTypes(types);

                const settings = await cachedGet('/settings');
                setResortSettings(settings);
            } catch (error) {
                console.error('Error fetching room:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRoom();
    }, [id]);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const { data } = await API.get(`/reviews/room/${id}`);
                setReviews(data);
            } catch (error) {
                console.error('Error fetching reviews:', error);
            }
        };

        fetchReviews();
    }, [id]);

    useEffect(() => {
        const fetchAvailability = async () => {
            if (!room || !checkIn || !checkOut || checkOut <= checkIn) {
                setAvailability(null);
                return;
            }

            setAvailabilityLoading(true);
            try {
                const { data } = await API.post('/bookings/availability', {
                    room: id,
                    checkInDate: checkIn,
                    checkOutDate: checkOut,
                    guests: normalizedGuests,
                    addOns
                });
                setAvailability(data);
            } catch (error) {
                setAvailability(null);
            } finally {
                setAvailabilityLoading(false);
            }
        };

        fetchAvailability();
    }, [id, room, checkIn, checkOut, normalizedGuests, addOns]);

    const handleCheckInChange = (date) => {
        setCheckIn(date);
        if (checkOut && date && checkOut <= date) {
            setCheckOut(null);
        }
    };

    const handleExtraGuestToggle = (isEnabled) => {
        setShowExtraGuests(isEnabled);
        if (!isEnabled) {
            setGuests((prev) => ({ ...prev, extraAdults: 0 }));
        }
    };

    const handleBooking = async () => {
        if (!user) {
            toast.info('Please login to book a room');
            return navigate('/login');
        }

        if (!checkIn || !checkOut) {
            return toast.warn('Please select check-in and check-out dates');
        }

        if (!pricing.isValid) {
            return toast.warn(pricing.message || 'Check-out must be after check-in');
        }
        if (availability && availability.availableRooms <= 0) {
            return toast.warn('All rooms of this kind are booked for these dates');
        }

        setIsBookingSheetOpen(false);
        setShowConfirmation(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const processBookingPayment = async () => {
        if (!guestName || !guestName.trim()) {
            toast.warn('Please enter guest name');
            return;
        }
        if (!guestEmail || !guestEmail.trim()) {
            toast.warn('Please enter contact email');
            return;
        }
        if (!guestPhone || !guestPhone.trim()) {
            toast.warn('Please enter phone number');
            return;
        }
        if (!validateMobileNumber(guestPhone)) {
            toast.warn("Phone number must start with '+' and include a country code, and be a valid mobile number.");
            return;
        }

        setShowConfirmation(false);
        setBookingLoading(true);
        try {
            const isPayAtProperty = paymentMethod === 'property' && resortSettings.payAtProperty;

            const { data } = await API.post('/bookings', {
                room: id,
                checkInDate: checkIn,
                checkOutDate: checkOut,
                guests: {
                    ...normalizedGuests
                },
                addOns,
                totalPrice: pricing.totalPrice,
                payAtProperty: isPayAtProperty,
                guestName: guestName.trim(),
                guestPhone: guestPhone.trim(),
                guestEmail: guestEmail.trim(),
                specialRequests: specialRequests.trim()
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            if (isPayAtProperty) {
                toast.success('Booking confirmed! Pay at property on arrival.');
                navigate(`/booking/success/${data._id}`);
                return;
            }

            toast.success('Room booked! Redirecting to payment...');
            await loadRazorpayCheckout();

            const { data: order } = await API.post('/payments/create-order', {
                bookingId: data._id
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            const razorpay = new window.Razorpay({
                key: order.key,
                amount: order.amount,
                currency: order.currency,
                name: 'Luxury Resort',
                description: order.description,
                order_id: order.orderId,
                prefill: {
                    name: user.name || '',
                    email: user.email || ''
                },
                notes: {
                    bookingId: data._id
                },
                theme: {
                    color: '#1b6b5f'
                },
                handler: async (response) => {
                    try {
                        await API.post('/payments/verify', {
                            bookingId: data._id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        }, {
                            headers: { Authorization: `Bearer ${user.token}` }
                        });

                        toast.success('Payment successful!');
                        navigate(`/booking/success/${data._id}`);
                    } catch (error) {
                        toast.error(error.response?.data?.message || 'Payment verification failed');
                        navigate(`/booking/cancel/${data._id}`);
                    }
                },
                modal: {
                    ondismiss: () => {
                        toast.info('Payment was not completed');
                    }
                }
            });

            razorpay.on('payment.failed', (response) => {
                toast.error(response.error?.description || 'Payment failed');
                navigate(`/booking/cancel/${data._id}`);
            });

            razorpay.open();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Booking failed');
        } finally {
            setBookingLoading(false);
        }
    };

    const pricedNights = Math.max(1, pricing.nights || 1);
    const totalEstimate = pricing.totalPrice;
    const totalRoomUnits = Math.max(1, Number(room?.totalRooms) || 1);
    const availableRoomUnits = availability ? availability.availableRooms : totalRoomUnits;
    const categoryDetails = roomTypes.find((type) => type.name === room?.type);
    // Adult capacity = base guests + extra guest limit (children are separate)
    const maxTotalGuests = (room?.maxGuests || 0) + roomExtraGuestLimit;
    const maxChildren = room?.maxChildren !== undefined ? Math.max(0, Number(room.maxChildren)) : 2;
    const shortDescription = room?.description?.split('. ')[0] || room?.description || 'A calm private stay shaped for slow mornings and easy evenings.';
    const displayedReviews = reviews.length ? reviews.slice(0, 3) : [
        { _id: 'stub-1', rating: 5, comment: 'Quiet mornings, thoughtful service, and every detail exactly where it should be.', user: { name: 'Sophie L.' }, createdAt: new Date() },
        { _id: 'stub-2', rating: 4, comment: 'The room felt private, polished, and genuinely restorative after a long week.', user: { name: 'Emma T.' }, createdAt: new Date() }
    ];

    if (loading) {
        return <RoomDetailsSkeleton />;
    }

    if (!room) {
        return <div className="min-h-screen pt-32 text-center text-slate-600">Room not found.</div>;
    }    if (showConfirmation) {
        return (
            <main className="min-h-screen bg-[#f7faf8] pt-16 pb-20 text-slate-900">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    {/* Back to Room Details Link */}
                    <button
                        type="button"
                        onClick={() => {
                            setShowConfirmation(false);
                            window.scrollTo({ top: 0, behavior: 'auto' });
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-100 hover:bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition mb-8"
                    >
                        <ArrowLeft size={16} />
                        <span className="hidden md:block">Back to room details</span>
                    </button>

                    {/* Stepper progress indicator */}
                    <div className="mb-12 max-w-3xl mx-auto">
                        <div className="flex items-center justify-between relative px-2">
                            {/* Connecting Line background */}
                            <div className="absolute top-5 left-4 right-4 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
                            {/* Connecting Line active */}
                            <div 
                                className="absolute top-5 left-4 h-0.5 bg-[#1b6b5f] -translate-y-1/2 z-0 transition-all duration-500" 
                                style={{ width: checkoutStep === 1 ? '0%' : checkoutStep === 2 ? '50%' : '100%' }}
                            />

                            {[
                                { step: 1, label: 'Personal Details' },
                                { step: 2, label: 'Booking Details' },
                                { step: 3, label: 'Payment' }
                            ].map((s) => (
                                <div key={s.step} className="flex flex-col items-center relative z-10">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors duration-300 ${
                                        checkoutStep > s.step 
                                            ? 'bg-[#1b6b5f] border-[#1b6b5f] text-white' 
                                            : checkoutStep === s.step 
                                                ? 'bg-white border-[#1b6b5f] text-[#1b6b5f]' 
                                                : 'bg-white border-slate-200 text-slate-400'
                                    }`}>
                                        {checkoutStep > s.step ? <Check size={18} /> : s.step}
                                    </div>
                                    <span className={`mt-2 text-xs font-semibold ${
                                        checkoutStep >= s.step ? 'text-[#1b6b5f]' : 'text-slate-400'
                                    }`}>{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Wizard Steps */}
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                        {checkoutStep === 1 && (
                            <div className="p-6 sm:p-8 space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-950 mb-1">Step 1: Personal Details</h2>
                                    <p className="text-sm text-slate-500">Please provide your contact details for the booking reservation.</p>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Full Name *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Enter your full name"
                                            value={guestName}
                                            onChange={(e) => setGuestName(e.target.value)}
                                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1b6b5f]"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Contact Email *</label>
                                            <input
                                                type="email"
                                                required
                                                placeholder="Enter your email address"
                                                value={guestEmail}
                                                onChange={(e) => setGuestEmail(e.target.value)}
                                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1b6b5f]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Phone Number *</label>
                                            <PhoneInput
                                                value={guestPhone}
                                                onChange={setGuestPhone}
                                                placeholder="98765 43210"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!guestName.trim()) return toast.warn('Please enter full name');
                                            if (!guestEmail.trim()) return toast.warn('Please enter email address');
                                            if (!guestPhone.trim()) return toast.warn('Please enter phone number');
                                            if (!validateMobileNumber(guestPhone)) {
                                                return toast.warn("Phone number must start with '+' and include a country code, and be a valid mobile number.");
                                            }
                                            setCheckoutStep(2);
                                        }}
                                        className="rounded-lg bg-[#1b6b5f] text-sm font-bold uppercase text-white px-6 py-3 hover:bg-[#15564d] transition"
                                    >
                                        Next: Booking Details
                                    </button>
                                </div>
                            </div>
                        )}

                        {checkoutStep === 2 && (
                            <div className="p-6 sm:p-8 space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-950 mb-1">Step 2: Booking Details</h2>
                                    <p className="text-sm text-slate-500">Review your stay details and add any special requests.</p>
                                </div>

                                <div className="p-4 rounded-xl bg-[#f7faf8] border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                                    <div>
                                        <p className="text-xs font-bold uppercase text-[#1b6b5f] mb-1">Selected Room</p>
                                        <p className="font-semibold text-slate-950">{room.name} ({room.type})</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase text-[#1b6b5f] mb-1">Stay Duration</p>
                                        <p className="font-semibold text-slate-900">
                                            {checkIn?.toLocaleDateString()} to {checkOut?.toLocaleDateString()} ({pricing.nights} night{pricing.nights > 1 ? 's' : ''})
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase text-[#1b6b5f] mb-1">Guests</p>
                                        <p className="font-semibold text-slate-900">
                                            {guests.adults} Adult{guests.adults > 1 ? 's' : ''}
                                            {showExtraGuests && guests.extraAdults > 0 && ` + ${guests.extraAdults} Extra`}
                                            {guests.children > 0 && `, ${guests.children} Child${guests.children > 1 ? 'ren' : ''}`}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase text-[#1b6b5f] mb-1">Add-ons</p>
                                        <p className="font-semibold text-slate-900">
                                            {addOns.earlyCheckIn && addOns.lateCheckOut 
                                                ? 'Early Check-in, Late Check-out' 
                                                : addOns.earlyCheckIn 
                                                    ? 'Early Check-in' 
                                                    : addOns.lateCheckOut 
                                                        ? 'Late Check-out' 
                                                        : 'None'}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Special Requests (Optional)</label>
                                    <textarea
                                        placeholder="e.g. high floor, dietary preferences, extra bedding, quiet room..."
                                        value={specialRequests}
                                        onChange={(e) => setSpecialRequests(e.target.value)}
                                        className="w-full h-24 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1b6b5f]"
                                    />
                                </div>

                                <div className="flex justify-between pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setCheckoutStep(1)}
                                        className="rounded-lg border border-slate-300 text-sm font-bold uppercase text-slate-600 px-6 py-3 hover:bg-slate-50 transition"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCheckoutStep(3)}
                                        className="rounded-lg bg-[#1b6b5f] text-sm font-bold uppercase text-white px-6 py-3 hover:bg-[#15564d] transition"
                                    >
                                        Next: Payment
                                    </button>
                                </div>
                            </div>
                        )}

                        {checkoutStep === 3 && (
                            <div className="p-6 sm:p-8 space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-950 mb-1">Step 3: Payment & Confirmation</h2>
                                    <p className="text-sm text-slate-500">Choose your preferred payment method and review the invoice breakdown.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Left Column: Invoice Breakdown & Cancellation Policy */}
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-sm">
                                            <p className="text-xs font-bold uppercase text-slate-500 mb-2">Invoice Breakdown</p>
                                            <div className="flex justify-between text-slate-600">
                                                <span>Base Stay x {pricing.nights} night{pricing.nights > 1 ? 's' : ''}</span>
                                                <span className="font-medium text-slate-900">{formatCurrency(pricing.subtotal)}</span>
                                            </div>

                                            {showExtraGuests && guests.extraAdults > 0 && (
                                                <div className="flex justify-between text-slate-600">
                                                    <span>Extra Guest Fee</span>
                                                    <span className="font-medium text-slate-900">{formatCurrency(pricing.extraGuestFee)}</span>
                                                </div>
                                            )}

                                            {pricing.earlyCheckInFee > 0 && (
                                                <div className="flex justify-between text-slate-600">
                                                    <span>Early Check-in</span>
                                                    <span className="font-medium text-slate-900">{formatCurrency(pricing.earlyCheckInFee)}</span>
                                                </div>
                                            )}

                                            {pricing.lateCheckOutFee > 0 && (
                                                <div className="flex justify-between text-slate-600">
                                                    <span>Late Check-out</span>
                                                    <span className="font-medium text-slate-900">{formatCurrency(pricing.lateCheckOutFee)}</span>
                                                </div>
                                            )}

                                            {pricing.tax > 0 && (
                                                <div className="flex justify-between text-[#1b6b5f]">
                                                    <span>Taxes (GST {resortSettings.gstPercent}%)</span>
                                                    <span className="font-bold">{formatCurrency(pricing.tax)}</span>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center text-base font-bold text-slate-950 pt-2 border-t border-slate-200">
                                                <span>Total Amount</span>
                                                <span className="text-lg text-[#1b6b5f]">{formatCurrency(pricing.totalPrice)}</span>
                                            </div>
                                        </div>

                                        {resortSettings.cancellationPolicy && (
                                            <div className="text-xs text-slate-500 bg-[#f7faf8] p-3 rounded-lg border border-slate-200">
                                                <span className="font-bold text-slate-700 block mb-1">Cancellation Policy:</span>
                                                {resortSettings.cancellationPolicy}
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Column: Payment Method Selection */}
                                    <div className="space-y-4">
                                        <p className="text-xs font-bold uppercase text-slate-500">Select Payment Method</p>
                                        <div className="space-y-3">
                                            <div
                                                onClick={() => setPaymentMethod('online')}
                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'online' ? 'border-[#1b6b5f] bg-[#f7faf8]' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Shield size={18} className={paymentMethod === 'online' ? 'text-[#1b6b5f]' : 'text-slate-400'} />
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-950">Pay Online Now</p>
                                                            <p className="text-[10px] text-slate-500">Secure payment via Razorpay</p>
                                                        </div>
                                                    </div>
                                                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'online' ? 'border-[#1b6b5f]' : 'border-slate-300'}`}>
                                                        {paymentMethod === 'online' && <div className="h-2.5 w-2.5 rounded-full bg-[#1b6b5f]" />}
                                                    </div>
                                                </div>
                                            </div>

                                            {resortSettings.payAtProperty && (
                                                <div
                                                    onClick={() => setPaymentMethod('property')}
                                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'property' ? 'border-[#1b6b5f] bg-[#f7faf8]' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <MapPin size={18} className={paymentMethod === 'property' ? 'text-[#1b6b5f]' : 'text-slate-400'} />
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-950">Pay at Property</p>
                                                                <p className="text-[10px] text-slate-500">Pay on arrival at resort</p>
                                                            </div>
                                                        </div>
                                                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'property' ? 'border-[#1b6b5f]' : 'border-slate-300'}`}>
                                                            {paymentMethod === 'property' && <div className="h-2.5 w-2.5 rounded-full bg-[#1b6b5f]" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between pt-6 border-t border-slate-100 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setCheckoutStep(2)}
                                        className="rounded-lg border border-slate-300 text-sm font-bold uppercase text-slate-600 px-6 py-3 hover:bg-slate-50 transition"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="button"
                                        onClick={processBookingPayment}
                                        disabled={bookingLoading}
                                        className="rounded-lg bg-[#1b6b5f] text-sm font-bold uppercase text-white px-8 py-3 hover:bg-[#15564d] shadow-lg shadow-[#1b6b5f]/20 transition disabled:opacity-50 min-w-[180px] flex items-center justify-center"
                                    >
                                        {bookingLoading ? <Loader2 className="animate-spin" size={18} /> : paymentMethod === 'online' ? 'Proceed to Payment' : 'Confirm Reservation'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        );
    }

    return (
        <>
            <main className="min-h-screen bg-[#f7faf8] pb-28 text-slate-900 md:pb-0">
                <section className="relative min-h-[92vh] overflow-hidden bg-slate-950">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentImageIndex}
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            className="absolute inset-0 cursor-grab active:cursor-grabbing"
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(e, { offset, velocity }) => {
                                const swipe = Math.abs(offset.x) > 50 && Math.abs(velocity.x) > 500 || Math.abs(offset.x) > 100;
                                if (swipe) {
                                    if (offset.x > 0) {
                                        prevImage();
                                    } else {
                                        nextImage();
                                    }
                                }
                            }}
                        >
                            <img
                                src={images[currentImageIndex]}
                                alt={`${room.name} view ${currentImageIndex + 1}`}
                                className="h-full w-full object-cover"
                            />
                        </motion.div>
                    </AnimatePresence>

                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-slate-950/10" />
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white/50 via-white/20 to-transparent" />

                    {/* Carousel Navigation */}
                    <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-3 z-30">
                        {images.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentImageIndex(idx)}
                                className={`h-1 rounded-full transition-all duration-500 ${idx === currentImageIndex ? 'w-12 bg-white' : 'w-4 bg-white/40 hover:bg-white/60'}`}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </div>

                    <div className="absolute right-8 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-4 lg:flex">
                        <button
                            onClick={prevImage}
                            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur transition hover:bg-white/20"
                            aria-label="Previous slide"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={nextImage}
                            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur transition hover:bg-white/20"
                            aria-label="Next slide"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>

                    <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-between px-4 pb-10 pt-24 sm:px-6 lg:px-8">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="inline-flex  w-fit md:mb-2 lg:mb-0 items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                        >
                            <ArrowLeft size={16} />
                            <span className="text-sm hidden md:block">Back to rooms</span>
                        </button>

                        <div className="grid items-end gap-8 lg:grid-cols-[1fr_400px]">
                            <div className="max-w-3xl">
                                <div className="mb-5 flex flex-wrap gap-2">
                                    <span className="rounded-lg bg-[#e4fff6] px-3 py-2 text-xs font-bold uppercase text-[#1b6b5f]">{room.type || 'Retreat'}</span>
                                    <span className="rounded-lg bg-white/15 px-3 py-2 text-xs font-bold uppercase text-white">{room.maxGuests} base guests</span>
                                    <span className="rounded-lg bg-white/15 px-3 py-2 text-xs font-bold uppercase text-white">{totalRoomUnits} rooms</span>
                                    <span className="rounded-lg bg-white/15 px-3 py-2 text-xs font-bold uppercase text-white">{formatCurrency(room.pricePerNight)} nightly</span>
                                </div>
                                <h1 className="max-w-4xl text-5xl font-semibold leading-tight text-white md:text-7xl">{room.name}</h1>
                                <p className="mt-5 max-w-2xl text-base leading-8 text-white/85 md:text-lg">{shortDescription}</p>
                            </div>

                            <div className="hidden border border-white/20 bg-white/95 p-5 shadow-2xl backdrop-blur md:block">
                                <p className="text-sm font-semibold uppercase text-[#1b6b5f]">Stay summary</p>
                                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                    <div className="border border-slate-200 bg-[#f7faf8] p-3">
                                        <label className="text-xs font-semibold uppercase text-slate-500">Check-in</label>
                                        <div className="relative mt-2">
                                            <Calendar className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400" size={15} />
                                            <DatePicker
                                                selected={checkIn}
                                                onChange={handleCheckInChange}
                                                selectsStart
                                                startDate={checkIn}
                                                endDate={checkOut}
                                                minDate={new Date()}
                                                placeholderText="Arrival"
                                                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#1b6b5f]"
                                            />
                                        </div>
                                    </div>
                                    <div className="border border-slate-200 bg-[#f7faf8] p-3">
                                        <label className="text-xs font-semibold uppercase text-slate-500">Check-out</label>
                                        <div className="relative mt-2">
                                            <Calendar className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400" size={15} />
                                            <DatePicker
                                                selected={checkOut}
                                                onChange={(date) => setCheckOut(date)}
                                                selectsEnd
                                                startDate={checkIn}
                                                endDate={checkOut}
                                                minDate={checkIn || new Date()}
                                                placeholderText="Departure"
                                                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#1b6b5f]"
                                            />
                                        </div>
                                    </div>
                                </div>
                                {checkIn && checkOut ? (
                                    <>
                                        <div className="mt-3 grid grid-cols-2 gap-3">
                                            <div className="border border-slate-200 bg-[#f7faf8] p-3">
                                                <p className="text-xs font-semibold uppercase text-slate-500">Adults</p>
                                                <div className="mt-2 flex items-center justify-between">
                                                    <button type="button" disabled={guests.adults <= 1} onClick={() => setGuests(g => ({ ...g, adults: Math.max(1, g.adults - 1) }))} className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-900 shadow-sm transition hover:bg-slate-100 ${guests.adults <= 1 ? 'opacity-30 cursor-not-allowed' : ''}`}><Minus size={14} /></button>
                                                    <span className="text-sm font-bold text-slate-900">{guests.adults}</span>
                                                    <button type="button" disabled={guests.adults >= room.maxGuests} onClick={() => setGuests(g => ({ ...g, adults: g.adults < room.maxGuests ? g.adults + 1 : g.adults }))} className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-900 shadow-sm transition hover:bg-slate-100 ${guests.adults >= room.maxGuests ? 'opacity-30 cursor-not-allowed' : ''}`}><Plus size={14} /></button>
                                                </div>
                                            </div>
                                            <div className="border border-slate-200 bg-[#f7faf8] p-3">
                                                <p className="text-xs font-semibold uppercase text-slate-500">Children <span className="normal-case text-[#1b6b5f] font-semibold"></span> <span className="normal-case text-slate-400">{resortSettings.childAgeLimit ? `(≤${resortSettings.childAgeLimit}yr)` : ''}</span></p>
                                                <div className="mt-2 flex items-center justify-between">
                                                    <button type="button" disabled={guests.children <= 0} onClick={() => setGuests(g => ({ ...g, children: Math.max(0, g.children - 1) }))} className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-900 shadow-sm transition hover:bg-slate-100 ${guests.children <= 0 ? 'opacity-30 cursor-not-allowed' : ''}`}><Minus size={14} /></button>
                                                    <span className="text-sm font-bold text-slate-900">{guests.children}</span>
                                                    <button type="button" disabled={guests.children >= maxChildren} onClick={() => setGuests(g => ({ ...g, children: g.children < maxChildren ? g.children + 1 : g.children }))} className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-900 shadow-sm transition hover:bg-slate-100 ${guests.children >= maxChildren ? 'opacity-30 cursor-not-allowed' : ''}`}><Plus size={14} /></button>
                                                </div>
                                            </div>
                                        </div>

                                        {roomExtraGuestLimit > 0 && (
                                            <div className="mt-3">
                                                <label className="flex items-center gap-2 cursor-pointer mb-2">
                                                    <input type="checkbox" checked={showExtraGuests} onChange={(e) => handleExtraGuestToggle(e.target.checked)} className="h-3.5 w-3.5 rounded border-slate-300 text-[#1b6b5f] accent-[#1b6b5f]" />
                                                    <span className="text-[10px] font-bold uppercase text-slate-500">Add Extra Guests</span>
                                                </label>

                                                <AnimatePresence>
                                                    {showExtraGuests && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                            <div className="border border-slate-200 bg-[#f7faf8] p-3 flex items-center justify-between">
                                                                <div>
                                                                    <p className="text-[10px] font-bold uppercase text-slate-500">Extra Adults</p>
                                                                    <p className="text-[10px] text-[#1b6b5f] font-semibold">+{formatCurrency(room?.extraGuestCharge)} / night</p>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <button type="button" disabled={guests.extraAdults <= 0} onClick={() => setGuests(g => ({ ...g, extraAdults: Math.max(0, g.extraAdults - 1) }))} className={`flex h-7 w-7 items-center justify-center rounded bg-white text-slate-900 shadow-sm transition hover:bg-slate-100 ${guests.extraAdults <= 0 ? 'opacity-30 cursor-not-allowed' : ''}`}><Minus size={12} /></button>
                                                                    <span className="text-sm font-bold text-slate-900">{guests.extraAdults}</span>
                                                                    <button type="button" disabled={guests.extraAdults >= roomExtraGuestLimit} onClick={() => setGuests(g => ({ ...g, extraAdults: g.extraAdults < roomExtraGuestLimit ? g.extraAdults + 1 : g.extraAdults }))} className={`flex h-7 w-7 items-center justify-center rounded bg-white text-slate-900 shadow-sm transition hover:bg-slate-100 ${guests.extraAdults >= roomExtraGuestLimit ? 'opacity-30 cursor-not-allowed' : ''}`}><Plus size={12} /></button>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        )}
                                        <p className="mt-2 text-[10px] text-slate-400 text-right uppercase font-bold tracking-tight">Total Capacity: {maxTotalGuests} Guests</p>
                                    </>
                                ) : (
                                    <div className="mt-3 p-4 border border-dashed border-slate-300 rounded bg-slate-50 text-center">
                                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Select dates to add guests</p>
                                    </div>
                                )}

                                {resortSettings.isActive && (resortSettings.earlyCheckInFee > 0 || resortSettings.lateCheckOutFee > 0) && (
                                    <div className="mt-3 space-y-2">
                                        {resortSettings.earlyCheckInFee > 0 && (
                                            <label className="flex items-center justify-between border border-slate-200 bg-[#f7faf8] rounded-lg p-2.5 cursor-pointer transition hover:border-[#1b6b5f]/30">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} className="text-[#1b6b5f]" />
                                                    <span className="text-xs font-semibold text-slate-700">Early Check-in</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-[#1b6b5f]">+{formatCurrency(resortSettings.earlyCheckInFee)}</span>
                                                    <input type="checkbox" checked={addOns.earlyCheckIn} onChange={(e) => setAddOns(a => ({ ...a, earlyCheckIn: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-[#1b6b5f] accent-[#1b6b5f]" />
                                                </div>
                                            </label>
                                        )}
                                        {resortSettings.lateCheckOutFee > 0 && (
                                            <label className="flex items-center justify-between border border-slate-200 bg-[#f7faf8] rounded-lg p-2.5 cursor-pointer transition hover:border-[#1b6b5f]/30">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} className="text-[#1b6b5f]" />
                                                    <span className="text-xs font-semibold text-slate-700">Late Check-out</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-[#1b6b5f]">+{formatCurrency(resortSettings.lateCheckOutFee)}</span>
                                                    <input type="checkbox" checked={addOns.lateCheckOut} onChange={(e) => setAddOns(a => ({ ...a, lateCheckOut: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-[#1b6b5f] accent-[#1b6b5f]" />
                                                </div>
                                            </label>
                                        )}
                                    </div>
                                )}
                                <p className={`mt-3 text-sm font-semibold ${availability && availableRoomUnits <= 0 ? 'text-red-600' : 'text-[#1b6b5f]'}`}>
                                    {availabilityLoading
                                        ? 'Checking availability...'
                                        : checkIn && checkOut
                                            ? pricing.isValid === false
                                                ? <span className="text-red-500">{pricing.message}</span>
                                                : `${availableRoomUnits} of ${totalRoomUnits} matching room${totalRoomUnits > 1 ? 's' : ''} available`
                                            : ''}
                                </p>
                                <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                                    <div>
                                        <p className="text-xs font-semibold uppercase text-slate-500">Estimate</p>
                                        <p className="mt-1 text-3xl font-semibold text-slate-950">{formatCurrency(totalEstimate)}</p>
                                        {(pricing.tax > 0 || pricing.serviceCharge > 0 || pricing.cleaningFee > 0 || pricing.extraGuestFee > 0) && (
                                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                                                INCLUDES
                                                {pricing.tax > 0 ? ` ${formatCurrency(pricing.tax)} TAX` : ''}
                                                {pricing.serviceCharge > 0 ? ` | ${formatCurrency(pricing.serviceCharge)} SRVC` : ''}
                                                {pricing.cleaningFee > 0 ? ` | ${formatCurrency(pricing.cleaningFee)} CLN` : ''}
                                                {pricing.extraGuestFee > 0 ? ` | ${formatCurrency(pricing.extraGuestFee)} EXT` : ''}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleBooking}
                                        disabled={bookingLoading || availabilityLoading || (availability && availableRoomUnits <= 0)}
                                        className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#1b6b5f] px-5 py-3 text-sm font-bold uppercase text-white transition hover:bg-[#15564d] disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                        {bookingLoading ? <Loader2 className="animate-spin" size={18} /> : 'Reserve'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap gap-x-12 gap-y-6 border-b border-slate-200 pb-12">
                        {[
                            { icon: Users, label: 'Guests', value: `Up to ${maxTotalGuests}` },
                            { icon: BedDouble, label: 'Bed', value: `${room.bedSize || 'King'} Space` },
                            { icon: Ruler, label: 'Size', value: `${room.roomSize || 400} sq ft` },
                            { icon: MapPin, label: 'Setting', value: room.type || 'Lake view' }
                        ].map((item) => (
                            <div key={item.label} className="flex items-center gap-4">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-[#1b6b5f]">
                                    <item.icon size={22} strokeWidth={1.5} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#1b6b5f]">{item.label}</p>
                                    <p className="mt-1 truncate text-[15px] font-semibold text-slate-500">{item.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_390px] lg:px-8">
                    <div className="space-y-10">
                        <div className="grid gap-8 border-b border-slate-200 pb-10 lg:grid-cols-[220px_1fr]">
                            <div>
                                <p className="text-sm font-bold uppercase text-[#1b6b5f]">About</p>
                                <h2 className="mt-3 text-3xl font-semibold text-slate-950">Private comfort with a resort rhythm</h2>
                            </div>
                            <p className="text-base leading-6 text-slate-600 text-justify">{room.description}</p>
                            {categoryDetails?.description && (
                                <div className="lg:col-start-2 border border-slate-200 bg-white p-4">
                                    <p className="text-xs font-bold uppercase text-[#1b6b5f]">Category note</p>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">{categoryDetails.description}</p>
                                </div>
                            )}
                        </div>

                        <div className="grid gap-6 md:grid-cols-3">
                            {categorizedSections.map((section) => (
                                <motion.div
                                    key={section.id}
                                    className="group relative h-80 overflow-hidden bg-slate-200 shadow-lg"
                                    whileHover={{ y: -5 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    <div className="absolute inset-0 flex">
                                        <AnimatePresence mode="popLayout">
                                            {section.images.slice(0, 1).map((img, idx) => (
                                                <motion.img
                                                    key={img}
                                                    src={img}
                                                    alt={section.label}
                                                    className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                />
                                            ))}
                                        </AnimatePresence>
                                    </div>

                                    {/* Multi-image indicator/stack effect */}
                                    {section.images.length > 1 && (
                                        <div className="absolute right-4 top-4 z-10 flex -space-x-4">
                                            {section.images.slice(0, 3).map((img, i) => (
                                                <div
                                                    key={i}
                                                    className="h-8 w-8 rounded-full border-2 border-white bg-slate-200 shadow-sm overflow-hidden"
                                                    style={{ zIndex: 3 - i }}
                                                >
                                                    <img src={img} className="h-full w-full object-cover" />
                                                </div>
                                            ))}
                                            {section.images.length > 3 && (
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#1b6b5f] text-[10px] font-bold text-white z-0">
                                                    +{section.images.length - 3}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                                        <p className="text-xs font-bold uppercase tracking-widest text-[#e4fff6] opacity-0 transition-opacity duration-300 group-hover:opacity-100 mb-1">Explore</p>
                                        <h3 className="text-xl font-semibold text-white">{section.label}</h3>
                                        <div className="mt-3 overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => setLightbox({ isOpen: true, images: section.images, index: 0 })}
                                                className="translate-y-10 text-xs font-bold uppercase text-white/70 transition duration-500 hover:text-white group-hover:translate-y-0"
                                            >
                                                View {section.images.length} Image{section.images.length > 1 ? 's' : ''}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setLightbox({ isOpen: true, images: section.images, index: 0 })}
                                        className="absolute inset-0 z-20 cursor-pointer"
                                        aria-label={`View ${section.label} gallery`}
                                    />
                                </motion.div>
                            ))}
                        </div>

                        <div className="py-8 border-y border-slate-200">
                            <p className="text-[#1b6b5f] font-bold text-sm mb-6">AMENITIES</p>
                            <div className="flex flex-wrap gap-x-10 gap-y-6">
                                {amenities.slice(0, showAllAmenities ? undefined : 6).map((item) => (
                                    <div key={item} className="flex items-center gap-3">
                                        <span className="text-slate-500">
                                            {amenityIcons[item] || <Check size={20} strokeWidth={1.5} />}
                                        </span>
                                        <span className="text-[15px] font-medium text-slate-700">{item}</span>
                                    </div>
                                ))}
                                {!showAllAmenities && amenities.length > 6 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAllAmenities(true)}
                                        className="text-[15px] font-bold text-blue-600 hover:text-blue-700 transition"
                                    >
                                        View All
                                    </button>
                                )}
                                {showAllAmenities && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAllAmenities(false)}
                                        className="text-[15px] font-bold text-blue-600 hover:text-blue-700 transition"
                                    >
                                        Show Less
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
                            <div>
                                <p className="text-sm font-bold uppercase text-[#1b6b5f]">Gallery</p>
                                <h2 className="mt-3 text-3xl font-semibold text-slate-950">A closer look</h2>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {images.slice(0, 6).map((img, index) => (
                                    <button
                                        key={`${img}-gallery-${index}`}
                                        type="button"
                                        onClick={() => {
                                            setSelectedImage(img);
                                            setLightbox({ isOpen: true, images, index });
                                        }}
                                        className={`overflow-hidden bg-slate-200 ${index === 0 ? 'sm:col-span-2 h-80' : 'h-48'}`}
                                    >
                                        <img src={img} alt={`${room.name} gallery ${index + 1}`} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-8 border-t border-slate-200 pt-10 lg:grid-cols-[220px_1fr]">
                            <div>
                                <p className="text-sm font-bold uppercase text-[#1b6b5f]">Reviews</p>
                                <h2 className="mt-3 text-3xl font-semibold text-slate-950">Guest notes</h2>
                            </div>
                            <div className="space-y-4">
                                {displayedReviews.map((review) => (
                                    <article key={review._id} className="border border-slate-200 bg-white p-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-950">{review.user?.name || 'Guest'}</h3>
                                                <p className="mt-1 text-sm text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <span className="inline-flex items-center gap-1 rounded-lg bg-[#fff5d7] px-3 py-2 text-sm font-semibold text-slate-800">
                                                <Star size={15} className="fill-[#e8b923] text-[#e8b923]" />
                                                {Number(review.rating || 0).toFixed(1)}
                                            </span>
                                        </div>
                                        <p className="mt-4 text-base leading-8 text-slate-600">"{review.comment}"</p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </div>

                    <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
                        <div className="border border-slate-200 bg-white p-5 shadow-xl">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-bold uppercase text-[#1b6b5f]">Book your stay</p>
                                    <p className="mt-2 text-3xl font-semibold text-slate-950">{formatCurrency(room.pricePerNight)} <span className="mt-1 text-sm text-slate-500">per night</span></p>

                                </div>
                                <span className="rounded-lg bg-[#e4fff6] px-3 text-xs font-bold uppercase text-[#1b6b5f]">{room.type}</span>
                            </div>

                            <div className="mt-2 space-y-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500">Check-in</label>
                                    <div className="relative mt-1">
                                        <Calendar className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400" size={16} />
                                        <DatePicker
                                            selected={checkIn}
                                            onChange={handleCheckInChange}
                                            selectsStart
                                            startDate={checkIn}
                                            endDate={checkOut}
                                            minDate={new Date()}
                                            placeholderText="Arrival"
                                            className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-[#1b6b5f]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500">Check-out</label>
                                    <div className="relative mt-2">
                                        <Calendar className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400" size={16} />
                                        <DatePicker
                                            selected={checkOut}
                                            onChange={(date) => setCheckOut(date)}
                                            selectsEnd
                                            startDate={checkIn}
                                            endDate={checkOut}
                                            minDate={checkIn || new Date()}
                                            placeholderText="Departure"
                                            className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-[#1b6b5f]"
                                        />
                                    </div>
                                </div>

                                {checkIn && checkOut ? (
                                    <div className="mt-2 space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase text-slate-500">Adults</p>
                                                <div className="mt-2 flex items-center justify-between border border-slate-300 p-2 rounded-lg">
                                                    <button type="button" disabled={guests.adults <= 1} onClick={() => setGuests(g => ({ ...g, adults: Math.max(1, g.adults - 1) }))} className={`flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-900 transition hover:bg-slate-200 ${guests.adults <= 1 ? 'opacity-30 cursor-not-allowed' : ''}`}><Minus size={14} /></button>
                                                    <span className="font-semibold text-slate-950">{guests.adults}</span>
                                                    <button type="button" disabled={guests.adults >= room.maxGuests} onClick={() => setGuests(g => ({ ...g, adults: g.adults < room.maxGuests ? g.adults + 1 : g.adults }))} className={`flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-900 transition hover:bg-slate-200 ${guests.adults >= room.maxGuests ? 'opacity-30 cursor-not-allowed' : ''}`}><Plus size={14} /></button>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase text-slate-500">Children <span className="normal-case text-[#1b6b5f] font-semibold">(Free)</span> <span className="normal-case text-slate-400 font-normal">{resortSettings.childAgeLimit ? `≤${resortSettings.childAgeLimit} yrs` : ''}</span></p>
                                                <div className="mt-2 flex items-center justify-between border border-slate-300 p-2 rounded-lg">
                                                    <button type="button" disabled={guests.children <= 0} onClick={() => setGuests(g => ({ ...g, children: Math.max(0, g.children - 1) }))} className={`flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-900 transition hover:bg-slate-200 ${guests.children <= 0 ? 'opacity-30 cursor-not-allowed' : ''}`}><Minus size={14} /></button>
                                                    <span className="font-semibold text-slate-950">{guests.children}</span>
                                                    <button type="button" disabled={guests.children >= maxChildren} onClick={() => setGuests(g => ({ ...g, children: g.children < maxChildren ? g.children + 1 : g.children }))} className={`flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-900 transition hover:bg-slate-200 ${guests.children >= maxChildren ? 'opacity-30 cursor-not-allowed' : ''}`}><Plus size={14} /></button>
                                                </div>
                                            </div>
                                        </div>

                                        {roomExtraGuestLimit > 0 && (
                                            <div className="mt-4 border-t border-slate-100 pt-4">
                                                <label className="flex items-center gap-3 cursor-pointer group mb-3">
                                                    <input type="checkbox" checked={showExtraGuests} onChange={(e) => handleExtraGuestToggle(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-[#1b6b5f] accent-[#1b6b5f]" />
                                                    <span className="text-xs font-bold uppercase text-slate-500 group-hover:text-slate-700 transition">Add Extra Guests</span>
                                                </label>

                                                <AnimatePresence>
                                                    {showExtraGuests && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                            <div className="border border-slate-200 bg-slate-50 rounded-xl p-3 flex items-center justify-between shadow-inner">
                                                                <div>
                                                                    <p className="text-[10px] font-bold uppercase text-slate-500">Extra Adults</p>
                                                                    <p className="text-[11px] text-[#1b6b5f] font-bold">+{formatCurrency(room?.extraGuestCharge)} / night</p>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <button type="button" disabled={guests.extraAdults <= 0} onClick={() => setGuests(g => ({ ...g, extraAdults: Math.max(0, g.extraAdults - 1) }))} className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm text-slate-950 ${guests.extraAdults <= 0 ? 'opacity-30 cursor-not-allowed' : ''}`}><Minus size={12} /></button>
                                                                    <span className="text-sm font-bold text-slate-950">{guests.extraAdults}</span>
                                                                    <button type="button" disabled={guests.extraAdults >= roomExtraGuestLimit} onClick={() => setGuests(g => ({ ...g, extraAdults: g.extraAdults < roomExtraGuestLimit ? g.extraAdults + 1 : g.extraAdults }))} className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm text-slate-950 ${guests.extraAdults >= roomExtraGuestLimit ? 'opacity-30 cursor-not-allowed' : ''}`}><Plus size={12} /></button>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="mt-4 p-6 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50 text-center">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Select check-in & check-out<br />to choose guests</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-2 border-y border-slate-200 py-5">
                                <div className={`mb-4 text-sm font-semibold ${availability && availableRoomUnits <= 0 ? 'text-red-600' : 'text-[#1b6b5f]'}`}>
                                    {availabilityLoading
                                        ? 'Checking availability...'
                                        : checkIn && checkOut
                                            ? `${availableRoomUnits} of ${totalRoomUnits} matching room${totalRoomUnits > 1 ? 's' : ''} available`
                                            : ''}
                                </div>
                                <div className="flex justify-between text-sm text-slate-600">
                                    <span>{pricing.nights ? `${pricedNights} selected night${pricedNights > 1 ? 's' : ''}` : 'Select dates for total'}</span>
                                    <span>{pricing.nights ? formatCurrency(totalEstimate) : formatCurrency(room.pricePerNight)}</span>
                                </div>
                                {pricing.nights > 0 && pricing.nightlyRates.length > 1 && (
                                    <div className="mt-3 flex justify-between text-sm text-slate-600">
                                        <span>Average nightly rate</span>
                                        <span>{formatCurrency(pricing.averageNightlyRate)}</span>
                                    </div>
                                )}
                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-base font-semibold text-slate-950">Total estimate</span>
                                    <div className="text-right">
                                        <span className="text-2xl font-semibold text-slate-950">{pricing.nights ? formatCurrency(totalEstimate) : 'Select dates'}</span>
                                        {pricing.nights > 0 && pricing.tax > 0 && <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">INCL {formatCurrency(pricing.tax)} TAXES & FEES</p>}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleBooking}
                                disabled={bookingLoading || availabilityLoading || (availability && availableRoomUnits <= 0)}
                                className="mt-6 flex w-full items-center justify-center rounded-lg bg-[#1b6b5f] px-5 py-4 text-sm font-bold uppercase text-white transition hover:bg-[#15564d] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {bookingLoading ? <Loader2 className="animate-spin" size={18} /> : 'Reserve now'}
                            </button>
                            <p className="mx-auto mt-4 text-center text-xs font-semibold uppercase text-slate-500">Secure payment powered by Razorpay</p>
                        </div>

                        <div className="mt-5 border border-slate-200 bg-white p-5">
                            <h3 className="text-xl font-semibold text-slate-950">Included</h3>
                            <div className="mt-4 space-y-3">
                                {['Daily housekeeping', 'Complimentary breakfast', 'High-speed WiFi', '24/7 concierge support'].map((item) => (
                                    <p key={item} className="flex items-center gap-3 text-sm text-slate-600">
                                        <Check size={16} className="text-[#1b6b5f]" />
                                        {item}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </aside>
                </section>

                {relatedRooms.length > 0 && (
                    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
                        <div className="flex flex-col gap-4 border-t border-slate-200 pt-12 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-sm font-bold uppercase text-[#1b6b5f]">Recommended stays</p>
                                <h2 className="mt-3 text-3xl font-semibold text-slate-950">Recommended rooms</h2>
                            </div>
                            <Link to="/rooms" className="text-sm border px-4 py-2 rounded-lg bg-white/10 font-bold uppercase text-slate-600 transition hover:text-[#1b6b5f]">Browse all rooms</Link>
                        </div>

                        <div className="mt-8 grid gap-5 md:grid-cols-3">
                            {relatedRooms.map((related) => (
                                <Link key={related._id} to={`/rooms/${related._id}`} className="group border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-xl">
                                    <div className="h-56 overflow-hidden bg-slate-200">
                                        <img src={related.images?.[0] || fallbackImage} alt={related.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                                    </div>
                                    <div className="p-5">
                                        <p className="text-xs font-bold uppercase text-[#1b6b5f]">{related.type}</p>
                                        <h3 className="mt-2 text-xl font-semibold text-slate-950">{related.name}</h3>
                                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{related.description}</p>
                                        <p className="mt-4 text-sm font-semibold text-slate-950">From {formatCurrency(related.pricePerNight)} / night</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-4 shadow-2xl backdrop-blur md:hidden">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase text-slate-500">Starting at</p>
                        <p className="text-xl font-semibold text-slate-950">{pricing.nights ? formatCurrency(totalEstimate) : formatCurrency(room.pricePerNight)}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsBookingSheetOpen(true)}
                        className="inline-flex min-w-[150px] items-center justify-center rounded-lg bg-[#1b6b5f] px-5 py-3 text-sm font-bold uppercase text-white transition hover:bg-[#15564d]"
                    >
                        Reserve
                    </button>
                </div>
            </div>

            {/* Mobile Booking Sheet */}
            <AnimatePresence>
                {isBookingSheetOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsBookingSheetOpen(false)}
                            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm md:hidden"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-x-0 bottom-0 z-50 rounded-t-[2.5rem] bg-white p-6 pb-12 shadow-2xl md:hidden"
                        >
                            <div className="mx-auto mb-6 h-1 w-12 rounded-full bg-slate-200" />

                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase text-[#1b6b5f]">Book your stay</p>
                                    <h2 className="mt-1 text-2xl font-semibold text-slate-950">{room.name}</h2>
                                </div>
                                <button
                                    onClick={() => setIsBookingSheetOpen(false)}
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-900"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="mt-8 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <label className="text-[10px] font-bold uppercase text-slate-500">Check-in</label>
                                        <div className="relative mt-2">
                                            <Calendar className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <DatePicker
                                                selected={checkIn}
                                                onChange={handleCheckInChange}
                                                selectsStart
                                                startDate={checkIn}
                                                endDate={checkOut}
                                                minDate={new Date()}
                                                placeholderText="Arrival"
                                                className="w-full bg-transparent pl-5 text-sm font-semibold text-slate-950 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <label className="text-[10px] font-bold uppercase text-slate-500">Check-out</label>
                                        <div className="relative mt-2">
                                            <Calendar className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <DatePicker
                                                selected={checkOut}
                                                onChange={(date) => setCheckOut(date)}
                                                selectsEnd
                                                startDate={checkIn}
                                                endDate={checkOut}
                                                minDate={checkIn || new Date()}
                                                placeholderText="Departure"
                                                className="w-full bg-transparent pl-5 text-sm font-semibold text-slate-950 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {checkIn && checkOut ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                <p className="text-[10px] font-bold uppercase text-slate-500">Adults</p>
                                                <div className="mt-2 flex items-center justify-between">
                                                    <button type="button" disabled={guests.adults <= 1} onClick={() => setGuests(g => ({ ...g, adults: Math.max(1, g.adults - 1) }))} className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-950 shadow-sm ${guests.adults <= 1 ? 'opacity-30 cursor-not-allowed' : ''}`}><Minus size={14} /></button>
                                                    <span className="text-sm font-bold text-slate-950">{guests.adults}</span>
                                                    <button type="button" disabled={guests.adults >= room.maxGuests} onClick={() => setGuests(g => ({ ...g, adults: g.adults < room.maxGuests ? g.adults + 1 : g.adults }))} className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-950 shadow-sm ${guests.adults >= room.maxGuests ? 'opacity-30 cursor-not-allowed' : ''}`}><Plus size={14} /></button>
                                                </div>
                                            </div>
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                <p className="text-[10px] font-bold uppercase text-slate-500">Children <span className="normal-case text-[#1b6b5f] font-semibold">(Free)</span></p>
                                                <div className="mt-2 flex items-center justify-between">
                                                    <button type="button" disabled={guests.children <= 0} onClick={() => setGuests(g => ({ ...g, children: Math.max(0, g.children - 1) }))} className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-950 shadow-sm ${guests.children <= 0 ? 'opacity-30 cursor-not-allowed' : ''}`}><Minus size={14} /></button>
                                                    <span className="text-sm font-bold text-slate-950">{guests.children}</span>
                                                    <button type="button" disabled={guests.children >= maxChildren} onClick={() => setGuests(g => ({ ...g, children: g.children < maxChildren ? g.children + 1 : g.children }))} className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-950 shadow-sm ${guests.children >= maxChildren ? 'opacity-30 cursor-not-allowed' : ''}`}><Plus size={14} /></button>
                                                </div>
                                            </div>
                                        </div>

                                        {roomExtraGuestLimit > 0 && (
                                            <div className="mt-2">
                                                <label className="flex items-center gap-3 border border-slate-200 bg-slate-50 rounded-2xl p-4 cursor-pointer">
                                                    <input type="checkbox" checked={showExtraGuests} onChange={(e) => handleExtraGuestToggle(e.target.checked)} className="h-5 w-5 rounded border-slate-300 text-[#1b6b5f] accent-[#1b6b5f]" />
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase text-slate-500">Add Extra Guests</p>
                                                        <p className="text-[11px] text-[#1b6b5f] font-semibold">+{formatCurrency(room?.extraGuestCharge)} / night</p>
                                                    </div>
                                                </label>

                                                <AnimatePresence>
                                                    {showExtraGuests && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-2">
                                                            <div className="rounded-2xl border border-[#1b6b5f]/20 bg-[#e4fff6]/30 p-4 flex items-center justify-between">
                                                                <p className="text-sm font-bold text-slate-900">Extra Adults</p>
                                                                <div className="flex items-center gap-4">
                                                                    <button type="button" disabled={guests.extraAdults <= 0} onClick={() => setGuests(g => ({ ...g, extraAdults: Math.max(0, g.extraAdults - 1) }))} className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-950 shadow-sm ${guests.extraAdults <= 0 ? 'opacity-30 cursor-not-allowed' : ''}`}><Minus size={14} /></button>
                                                                    <span className="text-lg font-bold text-slate-950">{guests.extraAdults}</span>
                                                                    <button type="button" disabled={guests.extraAdults >= roomExtraGuestLimit} onClick={() => setGuests(g => ({ ...g, extraAdults: g.extraAdults < roomExtraGuestLimit ? g.extraAdults + 1 : g.extraAdults }))} className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-950 shadow-sm ${guests.extraAdults >= roomExtraGuestLimit ? 'opacity-30 cursor-not-allowed' : ''}`}><Plus size={14} /></button>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="p-6 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50 text-center">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">Choose Dates First<br />To Configure Guests</p>
                                    </div>
                                )}

                                {resortSettings.isActive && (resortSettings.earlyCheckInFee > 0 || resortSettings.lateCheckOutFee > 0) && (
                                    <div className="space-y-3">
                                        {resortSettings.earlyCheckInFee > 0 && (
                                            <label className="flex items-center justify-between border border-slate-200 bg-slate-50 rounded-2xl p-4 cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <Clock size={16} className="text-[#1b6b5f]" />
                                                    <span className="text-sm font-semibold text-slate-700">Early Check-in</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-bold text-[#1b6b5f]">+{formatCurrency(resortSettings.earlyCheckInFee)}</span>
                                                    <input type="checkbox" checked={addOns.earlyCheckIn} onChange={(e) => setAddOns(a => ({ ...a, earlyCheckIn: e.target.checked }))} className="h-5 w-5 rounded border-slate-300 text-[#1b6b5f] accent-[#1b6b5f]" />
                                                </div>
                                            </label>
                                        )}
                                        {resortSettings.lateCheckOutFee > 0 && (
                                            <label className="flex items-center justify-between border border-slate-200 bg-slate-50 rounded-2xl p-4 cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <Clock size={16} className="text-[#1b6b5f]" />
                                                    <span className="text-sm font-semibold text-slate-700">Late Check-out</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-bold text-[#1b6b5f]">+{formatCurrency(resortSettings.lateCheckOutFee)}</span>
                                                    <input type="checkbox" checked={addOns.lateCheckOut} onChange={(e) => setAddOns(a => ({ ...a, lateCheckOut: e.target.checked }))} className="h-5 w-5 rounded border-slate-300 text-[#1b6b5f] accent-[#1b6b5f]" />
                                                </div>
                                            </label>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 border-t border-slate-100 pt-6">
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-xs font-bold uppercase text-slate-500">Total estimate</p>
                                        <p className="mt-1 text-3xl font-semibold text-slate-950">{formatCurrency(totalEstimate)}</p>
                                        {pricing.nights > 0 && pricing.tax > 0 && <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">INCL {formatCurrency(pricing.tax)} TAXES & FEES</p>}
                                        {pricing.nights > 1 && <p className="text-xs text-slate-500">for {pricing.nights} nights</p>}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleBooking}
                                        disabled={bookingLoading || availabilityLoading || (availability && availableRoomUnits <= 0)}
                                        className="inline-flex min-h-[60px] min-w-[160px] items-center justify-center rounded-2xl bg-[#1b6b5f] px-8 text-sm font-bold uppercase text-white shadow-lg shadow-[#1b6b5f]/20 transition active:scale-95 disabled:opacity-50"
                                    >
                                        {bookingLoading ? <Loader2 className="animate-spin" size={20} /> : 'Book Now'}
                                    </button>
                                </div>
                                <p className="mt-4 text-center text-[10px] font-bold uppercase text-slate-400">Secure booking powered by Razorpay</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>



            {lightbox.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 transition-all duration-300" role="dialog" aria-modal="true">
                    <button
                        type="button"
                        onClick={() => setLightbox({ isOpen: false, images: [], index: 0 })}
                        className="absolute right-6 top-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
                        aria-label="Close gallery"
                    >
                        <X size={24} />
                    </button>

                    {lightbox.images.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); lightboxPrev(); }}
                                className="absolute left-6 top-1/2 z-50 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
                            >
                                <ChevronLeft size={32} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); lightboxNext(); }}
                                className="absolute right-6 top-1/2 z-50 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
                            >
                                <ChevronRight size={32} />
                            </button>

                            <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-2 z-50 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full">
                                {lightbox.images.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setLightbox(prev => ({ ...prev, index: idx }))}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${idx === lightbox.index ? 'w-8 bg-white' : 'w-2 bg-white/40'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    <div className="relative h-full w-full flex items-center justify-center p-4 md:p-12 overflow-hidden" onClick={() => setLightbox({ isOpen: false, images: [], index: 0 })}>
                        <AnimatePresence mode="wait">
                            <motion.img
                                key={lightbox.images[lightbox.index]}
                                src={lightbox.images[lightbox.index]}
                                alt="Enlarged view"
                                className="max-h-full max-w-full object-contain shadow-2xl"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </>
    );
};

export default RoomDetails;
