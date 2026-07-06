import { Heart, Star, Calendar, Users, Check, ChevronDown, MapPin, Clock, Shield, Wifi, UtensilsCrossed, Sparkles, Copy, Phone, ArrowLeft } from 'lucide-react';
import { useEffect, useState, useContext, useRef } from 'react';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../api';
import { AuthContext } from '../context/AuthContext';
import { validateMobileNumber } from '../utils/validation';
import PhoneInput from '../components/PhoneInput';

const razorpayCheckoutUrl = 'https://checkout.razorpay.com/v1/checkout.js';
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

const getCheckoutDate = (checkInDate, duration) => {
    if (!checkInDate) return null;
    let nights = 1;
    const durationStr = duration.toLowerCase();
    const nightMatch = durationStr.match(/(\d+)\s*night/);
    if (nightMatch) {
        nights = parseInt(nightMatch[1]);
    } else {
        const dayMatch = durationStr.match(/(\d+)\s*day/);
        if (dayMatch) {
            nights = Math.max(1, parseInt(dayMatch[1]) - 1);
        }
    }
    const nextDate = new Date(checkInDate);
    nextDate.setDate(nextDate.getDate() + nights);
    return nextDate;
};

const parseDurationAbbreviation = (duration) => {
    if (!duration) return '';
    const dStr = duration.toLowerCase();
    const nightMatch = dStr.match(/(\d+)\s*night/);
    const dayMatch = dStr.match(/(\d+)\s*day/);
    
    const nights = nightMatch ? `${nightMatch[1]}N` : '';
    const days = dayMatch ? `${dayMatch[1]}D` : '';
    
    if (nights && days) {
        return `${nights}/${days}`;
    }
    return nights || days || duration;
};

const getDaysCount = (durationStr) => {
    if (!durationStr) return 3;
    const dStr = durationStr.toLowerCase();
    const dayMatch = dStr.match(/(\d+)\s*day/);
    if (dayMatch) return parseInt(dayMatch[1]);
    const nightMatch = dStr.match(/(\d+)\s*night/);
    if (nightMatch) return parseInt(nightMatch[1]) + 1;
    return 3;
};

const generateItinerary = (pkg, days) => {
    const itinerary = [];
    for (let i = 1; i <= days; i++) {
        if (i === 1) {
            itinerary.push({
                day: 1,
                title: 'Arrival & Grand Welcome',
                desc: 'Arrive at the resort where our guest relationships manager will offer you a signature welcome elixir. Proceed to suite check-in, enjoy a complimentary fruit platter, and conclude the day with a relaxing evening spa treatment.',
                activities: ['Airport/Station Pickup', 'Welcome Drink & Check-in', 'Evening Spa Session']
            });
        } else if (i === days) {
            itinerary.push({
                day: days,
                title: 'Farewell Breakfast & Check-Out',
                desc: 'Savor a delicious farm-to-table breakfast buffet. Spend your morning shopping at our organic boutique, receive a custom local farewell gift, check out of your suite, and board your complimentary private airport transfer.',
                activities: ['Breakfast Buffet', 'Boutique Shopping', 'Airport Transfer']
            });
        } else {
            const highlightIdx = (i - 2) % (pkg.highlights?.length || 1);
            const highlight = pkg.highlights && pkg.highlights[highlightIdx];
            
            let desc = '';
            let title = '';
            let activities = [];
            if (highlight) {
                title = `Resort Experience: ${highlight}`;
                desc = `Immerse yourself in today's package inclusion: "${highlight}". Our dedicated concierges will coordinate your reservations. You will also have full access to our private lagoons, beach activities, and evening musical lounges.`;
                activities = [highlight, 'Lagoon & Beach Access', 'Musical Lounge'];
            } else {
                const fillers = [
                    { title: 'Rejuvenation & Wellness Day', desc: 'Indulge in a sensory wellness session, including beach yoga at sunrise, custom herbal tea pairings, and access to our mineral thermal pools.', activities: ['Beach Yoga', 'Herbal Tea Pairing', 'Thermal Pool Access'] },
                    { title: 'Chef\'s Curated Gastronomy', desc: 'Savor a customized multicourse tasting menu prepared by our master chef, showcasing regional organic produce and fresh sea catch in a private dining enclave.', activities: ['Chef\'s Table', 'Wine Pairing', 'Private Dining'] },
                    { title: 'Nature Exploration & Relaxation', desc: 'Enjoy a guided tour of our local private plantation and nature trails, followed by private sunset mocktails served right at the lagoon deck.', activities: ['Plantation Tour', 'Nature Trail', 'Sunset Cocktails'] }
                ];
                const fillerIdx = (i - 2) % fillers.length;
                title = fillers[fillerIdx].title;
                desc = fillers[fillerIdx].desc;
                activities = fillers[fillerIdx].activities;
            }
            
            itinerary.push({ day: i, title, desc, activities });
        }
    }
    return itinerary;
};

const PackageDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    
    const [pkg, setPkg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeDetailTab, setActiveDetailTab] = useState('itinerary');
    const [expandedDay, setExpandedDay] = useState(1);
    const [copiedCoupon, setCopiedCoupon] = useState(false);

    // Booking Wizard States
    const [showBooking, setShowBooking] = useState(false);
    const [checkoutStep, setCheckoutStep] = useState(1);
    const [guestName, setGuestName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [guestPhone, setGuestPhone] = useState('');
    const [specialRequests, setSpecialRequests] = useState('');
    const [checkInDate, setCheckInDate] = useState('');
    const [roomsBooked, setRoomsBooked] = useState(1);
    const [adults, setAdults] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState('online');
    const [bookingLoading, setBookingLoading] = useState(false);

    const bookingSectionRef = useRef(null);

    useEffect(() => {
        const fetchPackage = async () => {
            try {
                setLoading(true);
                const { data } = await API.get(`/packages/${id}`);
                setPkg(data);
            } catch (error) {
                console.error('Error fetching package:', error);
                toast.error('Failed to load package details');
                navigate('/packages');
            } finally {
                setLoading(false);
            }
        };
        fetchPackage();
    }, [id, navigate]);

    const handleBookNowClick = () => {
        if (!user) {
            toast.info('Please login to book a package');
            navigate('/login');
            return;
        }
        setShowBooking(true);
        setGuestName(user.name || '');
        setGuestEmail(user.email || '');
        setGuestPhone(user.phone || '');
        setCheckoutStep(1);
        setCheckInDate('');
        setRoomsBooked(1);
        setAdults(1);
        setSpecialRequests('');
        setTimeout(() => {
            bookingSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleConfirmBooking = async () => {
        if (!guestName.trim()) return toast.warn('Please enter guest name');
        if (!guestEmail.trim()) return toast.warn('Please enter email address');
        if (!guestPhone.trim()) return toast.warn('Please enter phone number');
        if (!validateMobileNumber(guestPhone)) {
            return toast.warn("Phone number must start with '+' and include a country code, and be a valid mobile number.");
        }
        setBookingLoading(true);
        try {
            const checkoutDate = getCheckoutDate(checkInDate, pkg.duration);
            const isPayAtProperty = paymentMethod === 'property';

            const { data } = await API.post('/bookings', {
                package: pkg._id,
                checkInDate: new Date(checkInDate),
                checkOutDate: checkoutDate,
                guests: { adults, children: 0 },
                totalPrice: Math.round(pkg.price * (1 - (pkg.discount || 0) / 100)) * roomsBooked,
                payAtProperty: isPayAtProperty,
                guestName: guestName.trim(),
                guestPhone: guestPhone.trim(),
                guestEmail: guestEmail.trim(),
                specialRequests: specialRequests.trim(),
                roomsBooked
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            if (isPayAtProperty) {
                toast.success('Booking confirmed! Pay at property on arrival.');
                navigate(`/booking/success/${data._id}`);
                return;
            }

            toast.success('Booking created! Redirecting to payment...');
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
                name: 'Luxury Resort Package',
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

    const handleCopyCoupon = () => {
        navigator.clipboard.writeText('WELCOME').then(() => {
            setCopiedCoupon(true);
            toast.success('Coupon code copied!');
            setTimeout(() => setCopiedCoupon(false), 2000);
        });
    };

    if (loading || !pkg) {
        return (
            <div className="min-h-screen bg-white pt-4">
                <div className="animate-pulse">
                    <div className="h-[420px] bg-slate-200" />
                    <div className="max-w-7xl mx-auto px-6 py-10">
                        <div className="flex gap-8">
                            <div className="flex-1 space-y-4">
                                <div className="h-8 w-48 bg-slate-200 rounded-full" />
                                <div className="h-6 w-full bg-slate-100 rounded-xl" />
                                <div className="h-6 w-3/4 bg-slate-100 rounded-xl" />
                                <div className="h-40 bg-slate-100 rounded-2xl" />
                                <div className="h-40 bg-slate-100 rounded-2xl" />
                            </div>
                            <div className="w-[37%] hidden lg:block">
                                <div className="h-96 bg-slate-100 rounded-2xl" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const daysCount = getDaysCount(pkg.duration);
    const finalPrice = Math.round(pkg.price * (1 - (pkg.discount || 0) / 100));
    const savedAmount = Math.round(pkg.price * (pkg.discount || 0) / 100);

    return (
        <div className="min-h-screen bg-white">
            {/* Immersive Hero Banner */}
            <div className="relative h-[340px] sm:h-[420px] lg:h-[480px] overflow-hidden">
                <img
                    src={pkg.image}
                    alt={pkg.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
                
                {/* Back Button Overlay */}
                <button
                    onClick={() => navigate('/packages')}
                    className="absolute top-6 left-6 group flex items-center gap-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white px-4 py-2.5 rounded-full transition-all duration-300 border border-white/20 hover:border-white/40 shadow-lg"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span className="text-sm font-medium">All Packages</span>
                </button>

                {/* Wishlist Button */}
                <button
                    onClick={() => toast.info(`Added ${pkg.name} to wishlist!`)}
                    className="absolute top-6 right-6 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white p-3 rounded-full transition-all duration-300 border border-white/20 hover:border-white/40 shadow-lg hover:scale-110 active:scale-95"
                >
                    <Heart size={18} />
                </button>

                {/* Hero Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-10">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-white/20">
                                {parseDurationAbbreviation(pkg.duration)} Package
                            </span>
                            {pkg.discount > 0 && (
                                <span className="bg-gradient-to-r from-emerald-500 to-green-400 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                                    {pkg.discount}% OFF
                                </span>
                            )}
                            <span className="bg-amber-400/90 text-slate-900 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                                ★ Premium
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-white leading-tight mb-2 drop-shadow-lg">{pkg.name}</h1>
                        <p className="text-white/70 text-sm sm:text-base font-light max-w-2xl leading-relaxed line-clamp-2">{pkg.description}</p>
                    </div>
                </div>
            </div>

            {/* Quick Info Strip */}
            <div className="bg-white border-b border-slate-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
                    <div className="flex items-center gap-3 py-4 overflow-x-auto scrollbar-hide -mx-1 px-1">
                        <div className="flex items-center gap-2 bg-[#134941]/5 border border-[#134941]/10 text-[#134941] px-3.5 py-2 rounded-full flex-shrink-0">
                            <Calendar size={14} />
                            <span className="text-xs font-semibold">{pkg.duration}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 text-slate-600 px-3.5 py-2 rounded-full flex-shrink-0">
                            <Users size={14} />
                            <span className="text-xs font-semibold">Up to {pkg.capacity} Guests</span>
                        </div>
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 px-3.5 py-2 rounded-full flex-shrink-0">
                            <Shield size={14} />
                            <span className="text-xs font-semibold">Free Cancellation</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 text-slate-600 px-3.5 py-2 rounded-full flex-shrink-0">
                            <UtensilsCrossed size={14} />
                            <span className="text-xs font-semibold">Meals Included</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 text-slate-600 px-3.5 py-2 rounded-full flex-shrink-0">
                            <Wifi size={14} />
                            <span className="text-xs font-semibold">Free WiFi</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-10">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
                    
                    {/* Left Panel */}
                    <div className="w-full lg:w-[63%]">
                        {/* Pill Tabs */}
                        <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide pb-1">
                            {[
                                { id: 'itinerary', label: 'Day-wise Itinerary', icon: <Calendar size={14} /> },
                                { id: 'inclusions', label: 'Inclusions & Amenities', icon: <Check size={14} /> },
                                { id: 'policies', label: 'Policies', icon: <Shield size={14} /> }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveDetailTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap border ${
                                        activeDetailTab === tab.id
                                            ? 'bg-[#134941] text-white border-[#134941] shadow-md shadow-[#134941]/20'
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-[#134941]/30 hover:text-[#134941] hover:bg-[#134941]/5'
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        {activeDetailTab === 'itinerary' && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-lg font-serif text-slate-900">Your {daysCount}-Day Journey</h3>
                                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{daysCount} Days / {Math.max(1, daysCount - 1)} Nights</span>
                                </div>
                                {generateItinerary(pkg, daysCount).map((item) => (
                                    <div key={item.day} className="group">
                                        <button
                                            onClick={() => setExpandedDay(expandedDay === item.day ? null : item.day)}
                                            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left border ${
                                                expandedDay === item.day
                                                    ? 'bg-[#134941]/[0.03] border-[#134941]/15 shadow-sm'
                                                    : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                                            }`}
                                        >
                                            <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                                                expandedDay === item.day
                                                    ? 'bg-[#134941] text-white shadow-md shadow-[#134941]/25'
                                                    : 'bg-slate-100 text-slate-500 group-hover:bg-[#134941]/10 group-hover:text-[#134941]'
                                            }`}>
                                                {item.day}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-bold transition-colors ${expandedDay === item.day ? 'text-[#134941]' : 'text-slate-800'}`}>
                                                    Day {item.day}: {item.title}
                                                </p>
                                                {expandedDay !== item.day && (
                                                    <p className="text-[11px] text-slate-400 font-light mt-0.5 truncate">{item.desc.substring(0, 80)}...</p>
                                                )}
                                            </div>
                                            <div className={`flex-shrink-0 transition-transform duration-300 ${expandedDay === item.day ? 'rotate-180' : ''}`}>
                                                <ChevronDown size={18} className={expandedDay === item.day ? 'text-[#134941]' : 'text-slate-400'} />
                                            </div>
                                        </button>
                                        
                                        <div className={`overflow-hidden transition-all duration-400 ease-in-out ${expandedDay === item.day ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                            <div className="px-4 pb-4 pt-2 ml-[60px]">
                                                <p className="text-sm text-slate-600 font-light leading-relaxed mb-4">{item.desc}</p>
                                                {item.activities && item.activities.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {item.activities.map((activity, aIdx) => (
                                                            <span key={aIdx} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-[11px] font-medium px-3 py-1.5 rounded-lg">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-[#134941]" />
                                                                {activity}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeDetailTab === 'inclusions' && (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-lg font-serif text-slate-900 mb-4">Included Amenities</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {(pkg.amenities && pkg.amenities.length > 0 ? pkg.amenities : ['Luxury Suite Stay', 'Daily Gourmet Breakfast', 'High-Speed WiFi', 'Pool & Fitness Access']).map((amenity, i) => (
                                            <div key={i} className="flex items-center gap-3 bg-white border border-slate-100 p-3.5 rounded-xl hover:border-[#134941]/20 hover:bg-[#134941]/[0.02] transition-all duration-300 group">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center group-hover:bg-[#134941]/10 transition-colors">
                                                    <Check size={14} className="text-[#134941]" />
                                                </div>
                                                <span className="text-sm text-slate-700 font-medium">{amenity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-serif text-slate-900 mb-4">Package Highlights</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {(pkg.highlights && pkg.highlights.length > 0 ? pkg.highlights : ['Bespoke Private Dinner', 'Complimentary Spa Voucher', 'Guided Nature Trek']).map((highlight, i) => (
                                            <div key={i} className="relative flex items-start gap-3 bg-gradient-to-br from-[#134941]/[0.04] to-emerald-50/50 border border-[#134941]/10 p-4 rounded-xl group hover:shadow-sm transition-all duration-300">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#134941]/10 flex items-center justify-center mt-0.5">
                                                    <Sparkles size={14} className="text-[#134941]" />
                                                </div>
                                                <div>
                                                    <span className="text-sm text-slate-800 font-semibold">{highlight}</span>
                                                    <p className="text-[11px] text-slate-400 font-light mt-0.5">Included with this package</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-amber-50/50 border border-amber-100/80 rounded-xl p-4">
                                    <p className="text-xs text-amber-800 font-semibold mb-1">What's not included</p>
                                    <ul className="text-xs text-amber-700/80 font-light space-y-1">
                                        <li>• Personal expenses and tips</li>
                                        <li>• Travel insurance</li>
                                        <li>• Any services not mentioned in inclusions</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {activeDetailTab === 'policies' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-serif text-slate-900 mb-2">Resort Policies</h3>
                                
                                <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                                    <div className="p-5 border-b border-slate-50">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center mt-0.5">
                                                <Shield size={16} className="text-[#134941]" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-800 mb-1">Cancellation Policy</h4>
                                                <p className="text-xs text-slate-500 font-light leading-relaxed">Cancel up to 72 hours in advance of your check-in date for a full refund. Cancellations made within 72 hours are subject to a one-night cancellation penalty fee.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-5 border-b border-slate-50">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center mt-0.5">
                                                <Clock size={16} className="text-blue-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-800 mb-1">Check-in & Check-out</h4>
                                                <div className="flex flex-wrap gap-3 mt-2">
                                                    <div className="bg-slate-50 px-3 py-1.5 rounded-lg">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Check-in</span>
                                                        <span className="text-sm text-slate-800 font-semibold">2:00 PM</span>
                                                    </div>
                                                    <div className="bg-slate-50 px-3 py-1.5 rounded-lg">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Check-out</span>
                                                        <span className="text-sm text-slate-800 font-semibold">12:00 PM</span>
                                                    </div>
                                                </div>
                                                <p className="text-[11px] text-slate-400 font-light mt-2">Early check-in and late check-out subject to availability.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center mt-0.5">
                                                <MapPin size={16} className="text-purple-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-800 mb-1">Resort & Spa Guidelines</h4>
                                                <p className="text-xs text-slate-500 font-light leading-relaxed">Guests have full access to beach reserves, thermal rooms, and lagoons. Respectful attire required in wellness decks and formal dining areas. Please notify spa desk 2 hours before scheduled massages.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Sticky Booking Sidebar */}
                    <div className="w-full lg:w-[37%]">
                        <div className="lg:sticky lg:top-20 space-y-4">
                            {/* Price Card */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden">
                                {/* Price Header */}
                                <div className="bg-gradient-to-br from-[#134941] to-[#1b6b5f] p-5 text-white">
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-white/60 font-bold mb-1">Starting From</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-serif font-bold">₹{finalPrice.toLocaleString()}</span>
                                                {pkg.discount > 0 && (
                                                    <span className="text-sm text-white/50 line-through">₹{pkg.price.toLocaleString()}</span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-white/50 mt-0.5">per person · inclusive of taxes</p>
                                        </div>
                                        {pkg.discount > 0 && (
                                            <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg text-center">
                                                <p className="text-lg font-bold">{pkg.discount}%</p>
                                                <p className="text-[8px] uppercase tracking-wider font-bold">OFF</p>
                                            </div>
                                        )}
                                    </div>
                                    {pkg.discount > 0 && (
                                        <div className="mt-3 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2">
                                            <Sparkles size={12} className="text-amber-300" />
                                            <span className="text-[11px] font-medium text-white/90">You save ₹{savedAmount.toLocaleString()} on this package</span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-5 space-y-4">
                                    {/* Coupon Card */}
                                    <div className="bg-emerald-50/70 border border-dashed border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                                <span className="text-sm">🏷️</span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-emerald-900">WELCOME</p>
                                                <p className="text-[10px] text-emerald-700/70 font-light">Extra 5% off at checkout</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleCopyCoupon}
                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                                                copiedCoupon
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600'
                                            }`}
                                        >
                                            {copiedCoupon ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                                        </button>
                                    </div>

                                    {/* Pay at Property */}
                                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                        <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm">
                                            <span className="text-sm">🏨</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">Pay at Property Available</p>
                                            <p className="text-[10px] text-slate-400 font-light">No advance payment required</p>
                                        </div>
                                    </div>

                                    {/* Price Breakdown */}
                                    <div className="space-y-2 pt-3 border-t border-slate-100">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">Package Price</span>
                                            <span className="text-slate-700 font-medium">₹{pkg.price.toLocaleString()}</span>
                                        </div>
                                        {pkg.discount > 0 && (
                                            <div className="flex justify-between text-xs">
                                                <span className="text-emerald-600">Discount ({pkg.discount}%)</span>
                                                <span className="text-emerald-600 font-medium">-₹{savedAmount.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">Taxes & Fees</span>
                                            <span className="text-slate-400 font-medium">Included</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                                            <span className="text-sm font-bold text-slate-800">Total Amount</span>
                                            <span className="text-xl font-serif font-bold text-[#134941]">₹{finalPrice.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Book Now CTA */}
                                    <button 
                                        onClick={handleBookNowClick}
                                        className="w-full bg-[#134941] hover:bg-[#1b6b5f] text-white font-bold uppercase tracking-wider py-4 rounded-xl shadow-lg shadow-[#134941]/20 hover:shadow-xl hover:shadow-[#134941]/25 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 text-xs flex items-center justify-center gap-2"
                                    >
                                        <span>Book This Package</span>
                                        <span className="text-white/40">→</span>
                                    </button>

                                    {/* Call CTA */}
                                    <a href="tel:+919999999999" className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 hover:text-[#134941] hover:border-[#134941]/30 font-bold uppercase tracking-wider py-3 rounded-xl transition-all duration-300 text-xs">
                                        <Phone size={13} />
                                        <span>Need Help? Call Us</span>
                                    </a>
                                </div>
                            </div>

                            {/* Trust Badges */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-white border border-slate-100 rounded-xl p-3 text-center">
                                    <Shield size={16} className="mx-auto mb-1 text-[#134941]" />
                                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Secure Booking</p>
                                </div>
                                <div className="bg-white border border-slate-100 rounded-xl p-3 text-center">
                                    <Star size={16} className="mx-auto mb-1 text-amber-500" />
                                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Top Rated</p>
                                </div>
                                <div className="bg-white border border-slate-100 rounded-xl p-3 text-center">
                                    <Check size={16} className="mx-auto mb-1 text-emerald-600" />
                                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Verified</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Package Booking Checkout Section */}
            {showBooking && (
                <section ref={bookingSectionRef} className="py-16 bg-gradient-to-b from-slate-50 to-white">
                    <div className="container mx-auto px-6">
                        <div className="max-w-4xl mx-auto">
                            {/* Section Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <span className="text-black uppercase tracking-[0.3em] text-xs font-bold mb-2 block">Checkout</span>
                                    <h2 className="text-3xl md:text-4xl font-serif text-black">Book {pkg.name}</h2>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowBooking(false);
                                        setCheckoutStep(1);
                                    }}
                                    className="text-slate-400 hover:text-slate-700 px-4 py-2 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition text-sm font-medium flex items-center gap-2"
                                >
                                    ✕ Cancel
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Column — Form Steps */}
                                <div className="lg:col-span-2">
                                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                                        {/* Stepper Progress */}
                                        <div className="px-8 pt-8 pb-2 flex justify-between items-center relative">
                                            <div className="absolute top-11 left-14 right-14 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
                                            <div 
                                                className="absolute top-11 left-14 h-0.5 bg-[#1b6b5f] -translate-y-1/2 z-0 transition-all duration-500"
                                                style={{ width: checkoutStep === 1 ? '0%' : checkoutStep === 2 ? '42%' : '85%' }}
                                            />
                                            {[
                                                { step: 1, label: 'Guest Details' },
                                                { step: 2, label: 'Date & Rooms' },
                                                { step: 3, label: 'Payment' }
                                            ].map((s) => (
                                                <div key={s.step} className="flex flex-col items-center relative z-10">
                                                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors duration-200 ${
                                                        checkoutStep > s.step 
                                                            ? 'bg-[#1b6b5f] border-[#1b6b5f] text-white' 
                                                            : checkoutStep === s.step 
                                                                ? 'bg-white border-[#1b6b5f] text-[#1b6b5f] shadow-md' 
                                                                : 'bg-white border-slate-200 text-slate-400'
                                                    }`}>
                                                        {checkoutStep > s.step ? '✓' : s.step}
                                                    </div>
                                                    <span className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${
                                                        checkoutStep >= s.step ? 'text-[#1b6b5f]' : 'text-slate-400'
                                                    }`}>{s.label}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Step Content */}
                                        <div className="p-8">
                                            {checkoutStep === 1 && (
                                                <div className="space-y-5">
                                                    <div>
                                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Guest Name *</label>
                                                        <input
                                                            type="text"
                                                            value={guestName}
                                                            onChange={(e) => setGuestName(e.target.value)}
                                                            placeholder="Enter guest name"
                                                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1b6b5f] focus:ring-1 focus:ring-[#1b6b5f]/20"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Contact Email *</label>
                                                            <input
                                                                type="email"
                                                                value={guestEmail}
                                                                onChange={(e) => setGuestEmail(e.target.value)}
                                                                placeholder="guest@example.com"
                                                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1b6b5f] focus:ring-1 focus:ring-[#1b6b5f]/20"
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Phone Number *</label>
                                                            <PhoneInput
                                                                value={guestPhone}
                                                                onChange={setGuestPhone}
                                                                placeholder="98765 43210"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-end pt-5 border-t">
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
                                                            className="rounded-lg bg-[#1b6b5f] text-xs font-bold uppercase tracking-wider text-white px-6 py-3 hover:bg-[#15564d] transition"
                                                        >
                                                            Next Step →
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {checkoutStep === 2 && (
                                                <div className="space-y-5">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Check-in Date *</label>
                                                            <input
                                                                type="date"
                                                                value={checkInDate}
                                                                min={new Date().toISOString().split('T')[0]}
                                                                onChange={(e) => setCheckInDate(e.target.value)}
                                                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1b6b5f] focus:ring-1 focus:ring-[#1b6b5f]/20"
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Calculated Check-out</label>
                                                            <div className="w-full rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600 font-medium select-none">
                                                                {checkInDate ? getCheckoutDate(checkInDate, pkg.duration).toLocaleDateString() : 'Select check-in first'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Rooms Booked</label>
                                                            <select
                                                                value={roomsBooked}
                                                                onChange={(e) => setRoomsBooked(Number(e.target.value))}
                                                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1b6b5f] focus:ring-1 focus:ring-[#1b6b5f]/20"
                                                            >
                                                                {[1, 2, 3, 4, 5].map(n => (
                                                                    <option key={n} value={n}>{n} Room{n > 1 ? 's' : ''}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Guests</label>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setAdults(prev => Math.max(1, prev - 1))}
                                                                    className="w-10 h-10 rounded-lg border flex items-center justify-center text-slate-600 hover:bg-slate-50 transition font-bold"
                                                                >
                                                                    −
                                                                </button>
                                                                <span className="text-sm font-semibold text-center text-slate-900 min-w-[60px]">{adults} Adult{adults > 1 ? 's' : ''}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setAdults(prev => Math.min(pkg.capacity, prev + 1))}
                                                                    className="w-10 h-10 rounded-lg border flex items-center justify-center text-slate-600 hover:bg-slate-50 transition font-bold"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Special Requests (Optional)</label>
                                                        <textarea
                                                            value={specialRequests}
                                                            onChange={(e) => setSpecialRequests(e.target.value)}
                                                            placeholder="High floor, dietary requests, etc."
                                                            className="w-full h-20 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1b6b5f] focus:ring-1 focus:ring-[#1b6b5f]/20 resize-none"
                                                        />
                                                    </div>
                                                    <div className="flex justify-between pt-5 border-t">
                                                        <button
                                                            type="button"
                                                            onClick={() => setCheckoutStep(1)}
                                                            className="rounded-lg border border-slate-300 text-xs font-bold uppercase tracking-wider text-slate-600 px-6 py-3 hover:bg-slate-50 transition"
                                                        >
                                                            ← Back
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (!checkInDate) return toast.warn('Please select check-in date');
                                                                setCheckoutStep(3);
                                                            }}
                                                            className="rounded-lg bg-[#1b6b5f] text-xs font-bold uppercase tracking-wider text-white px-6 py-3 hover:bg-[#15564d] transition"
                                                        >
                                                            Next Step →
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {checkoutStep === 3 && (
                                                <div className="space-y-5">
                                                    <div className="space-y-3">
                                                        <p className="text-xs font-bold uppercase text-slate-500">Select Payment Option</p>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div
                                                                onClick={() => setPaymentMethod('online')}
                                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                                    paymentMethod === 'online' 
                                                                        ? 'border-[#1b6b5f] bg-[#f7faf8] shadow-md' 
                                                                        : 'border-slate-100 hover:border-slate-200 bg-white'
                                                                }`}
                                                            >
                                                                <p className="text-sm font-bold text-slate-950">💳 Pay Online</p>
                                                                <p className="text-xs text-slate-500 mt-1">Secure via Razorpay</p>
                                                            </div>
                                                            <div
                                                                onClick={() => setPaymentMethod('property')}
                                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                                    paymentMethod === 'property' 
                                                                        ? 'border-[#1b6b5f] bg-[#f7faf8] shadow-md' 
                                                                        : 'border-slate-100 hover:border-slate-200 bg-white'
                                                                }`}
                                                            >
                                                                <p className="text-sm font-bold text-slate-950">🏨 Pay at Property</p>
                                                                <p className="text-xs text-slate-500 mt-1">On arrival check-in</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between pt-5 border-t">
                                                        <button
                                                            type="button"
                                                            onClick={() => setCheckoutStep(2)}
                                                            className="rounded-lg border border-slate-300 text-xs font-bold uppercase tracking-wider text-slate-600 px-6 py-3 hover:bg-slate-50 transition"
                                                        >
                                                            ← Back
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={handleConfirmBooking}
                                                            disabled={bookingLoading}
                                                            className="rounded-lg bg-[#1b6b5f] text-xs font-bold uppercase tracking-wider text-white px-8 py-3 hover:bg-[#15564d] transition flex items-center gap-2 disabled:opacity-50"
                                                        >
                                                            {bookingLoading ? 'Processing...' : paymentMethod === 'online' ? 'Proceed to Payment →' : 'Confirm Booking ✓'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column — Package Summary Sidebar */}
                                <div className="lg:col-span-1">
                                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden sticky top-28">
                                        <div className="h-48 overflow-hidden bg-slate-100">
                                            <img
                                                src={pkg.image}
                                                alt={pkg.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        <div className="p-6 space-y-4">
                                            <h3 className="text-xl font-serif text-slate-900">{pkg.name}</h3>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center justify-between text-slate-600">
                                                    <span>📅 Duration</span>
                                                    <span className="font-medium text-slate-900">{pkg.duration}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-slate-600">
                                                    <span>👥 Capacity</span>
                                                    <span className="font-medium text-slate-900">Up to {pkg.capacity} guests</span>
                                                </div>
                                                {checkInDate && (
                                                    <div className="flex items-center justify-between text-slate-600">
                                                        <span>🗓️ Check-in</span>
                                                        <span className="font-medium text-slate-900">{new Date(checkInDate).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                                {checkInDate && (
                                                    <div className="flex items-center justify-between text-slate-600">
                                                        <span>🗓️ Check-out</span>
                                                        <span className="font-medium text-slate-900">{getCheckoutDate(checkInDate, pkg.duration).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-4 border-t space-y-2">
                                                <div className="flex justify-between text-sm text-slate-600">
                                                    <span>Package Fee</span>
                                                    <span className="font-medium text-slate-900">₹{pkg.price.toLocaleString()}</span>
                                                </div>
                                                {pkg.discount > 0 && (
                                                    <div className="flex justify-between text-sm text-green-600">
                                                        <span>Discount ({pkg.discount}%)</span>
                                                        <span className="font-medium">-₹{savedAmount.toLocaleString()}</span>
                                                    </div>
                                                )}
                                                {roomsBooked > 1 && (
                                                    <div className="flex justify-between text-sm text-slate-600">
                                                        <span>× {roomsBooked} rooms</span>
                                                        <span className="font-medium text-slate-900">₹{(finalPrice * roomsBooked).toLocaleString()}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center font-bold text-slate-900 pt-3 border-t text-base">
                                                    <span>Total</span>
                                                    <span className="text-[#1b6b5f] text-xl">₹{(finalPrice * roomsBooked).toLocaleString()}</span>
                                                </div>
                                            </div>

                                            {pkg.discount > 0 && (
                                                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center">
                                                    <span className="text-green-700 text-xs font-bold">🎉 You save ₹{(savedAmount * roomsBooked).toLocaleString()}!</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default PackageDetail;
