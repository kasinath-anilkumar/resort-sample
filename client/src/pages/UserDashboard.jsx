import { AnimatePresence, motion } from 'framer-motion';
import {
    Bell,
    Calendar,
    CreditCard,
    Download,
    Edit2,
    Eye,
    EyeOff,
    Heart,
    LogOut,
    Settings,
    Star,
    Trash2,
    Upload,
    User as UserIcon,
    X,
    Home,
    ChevronRight,
    ChevronDown,
    Loader2,
    Lock,
    Shield,
    AlertCircle,
    Globe,
    BellOff
} from 'lucide-react';
import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../api';
import { AuthContext } from '../context/AuthContext';
import { validateMobileNumber, parsePhoneNumber } from '../utils/validation';
import PhoneInput from '../components/PhoneInput';

// Tab Configuration
const TAB_CONFIG = {
    profile: { icon: UserIcon, label: 'Profile', id: 'profile' },
    bookings: { icon: Calendar, label: 'Bookings', id: 'bookings' },
    payments: { icon: CreditCard, label: 'Payments', id: 'payments' },
    wishlist: { icon: Heart, label: 'Wishlist', id: 'wishlist' },
    reviews: { icon: Star, label: 'Reviews', id: 'reviews' },
    notifications: { icon: Bell, label: 'Notifications', id: 'notifications' },
    settings: { icon: Settings, label: 'Settings', id: 'settings' }
};

const UserDashboard = () => {
    const { user, logout, updateUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const [showTabDropdown, setShowTabDropdown] = useState(false);
    const [loading, setLoading] = useState(false);

    // Profile State
    const [profileForm, setProfileForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        avatar: user?.avatar || ''
    });
    const [editingProfile, setEditingProfile] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
    const [showPassword, setShowPassword] = useState(false);

    // Bookings State
    const [bookings, setBookings] = useState([]);
    const [bookingFilter, setBookingFilter] = useState('all');
    const [selectedBooking, setSelectedBooking] = useState(null);

    // Payments State
    const [payments, setPayments] = useState([]);
    const [invoices, setInvoices] = useState([]);

    // Wishlist State
    const [wishlist, setWishlist] = useState([]);

    // Reviews State
    const [reviews, setReviews] = useState([]);
    const [writingReview, setWritingReview] = useState(null);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

    // Notifications State
    const [notifications, setNotifications] = useState([]);
    const [notificationPrefs, setNotificationPrefs] = useState({
        bookingUpdates: true,
        offers: true,
        checkInReminders: true,
        reviews: true,
        email: true
    });

    // Settings State
    const [settings, setSettings] = useState({
        language: 'en',
        notifications: true,
        privateProfile: false,
        emailSubscription: true
    });

    // Fetch all data on mount
    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchAllData();
    }, [user, navigate]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [bookingsRes, wishlistRes, reviewsRes, paymentsRes, notificationsRes] = await Promise.all([
                API.get(`/bookings/mybookings`).catch(() => ({ data: [] })),
                API.get(`/users/${user?._id}/wishlist`).catch(() => ({ data: [] })),
                API.get(`/reviews/myreviews`).catch(() => ({ data: [] })),
                API.get(`/payments/myhistory`).catch(() => ({ data: [] })),
                API.get(`/notifications`).catch(() => ({ data: [] }))
            ]);

            setBookings(bookingsRes.data || []);
            setWishlist(wishlistRes.data || []);
            setReviews(reviewsRes.data || []);
            setPayments(paymentsRes.data || []);
            setNotifications(notificationsRes.data || []);

            // Set profile form info from user context
            if (user) {
                setProfileForm(prev => ({
                    ...prev,
                    name: user.name || '',
                    email: user.email || '',
                    phone: user.phone || prev.phone || '',
                    avatar: user.avatar || ''
                }));
            }

            // Mock invoices data
            setInvoices(paymentsRes.data?.map((payment, idx) => ({
                id: idx + 1,
                bookingId: payment.bookingId,
                amount: payment.amount,
                date: payment.date,
                status: 'completed'
            })) || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredBookings = useMemo(() => {
        const now = new Date();
        if (bookingFilter === 'upcoming') {
            return bookings.filter(b => new Date(b.checkInDate) > now && !b.isCancelled);
        } else if (bookingFilter === 'past') {
            return bookings.filter(b => new Date(b.checkOutDate) < now || b.isCancelled);
        }
        return bookings;
    }, [bookings, bookingFilter]);

    // Profile Functions
    const handleUpdateProfile = async () => {
        let phoneToSave = profileForm.phone;
        const { number: numPart } = parsePhoneNumber(profileForm.phone);
        if (!numPart || !numPart.trim()) {
            phoneToSave = '';
        }

        if (phoneToSave) {
            if (!validateMobileNumber(phoneToSave)) {
                toast.warn("Phone number must start with '+' and include a country code, and be a valid mobile number.");
                return;
            }
        }
        try {
            setLoading(true);
            const { data } = await API.put(`/users/profile`, { ...profileForm, phone: phoneToSave });
            toast.success('Profile updated successfully');
            updateUser(data);
            setProfileForm(prev => ({ ...prev, phone: phoneToSave }));
            setEditingProfile(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordForm.new !== passwordForm.confirm) {
            toast.error('Passwords do not match');
            return;
        }
        try {
            setLoading(true);
            await API.put(`/users/change-password`, passwordForm);
            toast.success('Password changed successfully');
            setPasswordForm({ current: '', new: '', confirm: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            setLoading(true);
            const { data } = await API.post(`/users/upload-avatar`, formData, {
                headers: {
                    Authorization: `Bearer ${user?.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setProfileForm(prev => ({ ...prev, avatar: data.avatar }));
            toast.success('Avatar updated successfully');
        } catch (error) {
            toast.error('Failed to upload avatar');
        } finally {
            setLoading(false);
        }
    };

    // Booking Functions
    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;
        try {
            setLoading(true);
            await API.put(`/bookings/${bookingId}/cancel`, {});
            toast.success('Booking cancelled successfully');
            fetchAllData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel booking');
        } finally {
            setLoading(false);
        }
    };

    // Wishlist Functions
    const handleToggleWishlist = async (roomId) => {
        try {
            await API.put(`/users/wishlist/${roomId}`, {});
            fetchAllData();
            toast.success('Wishlist updated');
        } catch (error) {
            toast.error('Failed to update wishlist');
        }
    };

    const handleQuickRebook = (room) => {
        navigate(`/rooms/${room._id}`);
    };

    // Review Functions
    const handleSubmitReview = async (bookingId) => {
        if (!reviewForm.comment.trim()) {
            toast.error('Please write a review');
            return;
        }

        const booking = bookings.find(b => b._id === bookingId);
        if (!booking) {
            toast.error('Booking not found');
            return;
        }

        try {
            setLoading(true);
            await API.post(`/reviews`, {
                room: booking.room._id,
                rating: reviewForm.rating,
                comment: reviewForm.comment
            });
            toast.success('Review submitted successfully');
            setWritingReview(null);
            setReviewForm({ rating: 5, comment: '' });
            fetchAllData();
        } catch (error) {
            toast.error('Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('Delete this review?')) return;
        try {
            setLoading(true);
            await API.delete(`/reviews/${reviewId}`);
            toast.success('Review deleted');
            fetchAllData();
        } catch (error) {
            toast.error('Failed to delete review');
        } finally {
            setLoading(false);
        }
    };

    // Notification Functions
    const handleClearNotifications = async () => {
        try {
            await API.delete(`/notifications`);
            setNotifications([]);
            toast.success('Notifications cleared');
        } catch (error) {
            toast.error('Failed to clear notifications');
        }
    };

    const handleUpdateNotificationPrefs = async () => {
        try {
            setLoading(true);
            await API.put(`/users/notification-preferences`, notificationPrefs);
            toast.success('Notification preferences updated');
        } catch (error) {
            toast.error('Failed to update preferences');
        } finally {
            setLoading(false);
        }
    };

    // Download Invoice
    const handleDownloadInvoice = (invoice) => {
        toast.info('Invoice download feature coming soon');
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileTab {...{ profileForm, setProfileForm, editingProfile, setEditingProfile, handleUpdateProfile, loading }} />;
            case 'bookings':
                return <BookingsTab {...{ filteredBookings, bookingFilter, setBookingFilter, selectedBooking, setSelectedBooking, handleCancelBooking, loading }} />;
            case 'payments':
                return <PaymentsTab {...{ payments, invoices, handleDownloadInvoice, loading }} />;
            case 'wishlist':
                return <WishlistTab {...{ wishlist, handleToggleWishlist, handleQuickRebook, loading }} />;
            case 'reviews':
                return <ReviewsTab {...{ reviews, bookings, writingReview, setWritingReview, reviewForm, setReviewForm, handleSubmitReview, handleDeleteReview, loading }} />;
            case 'notifications':
                return <NotificationsTab {...{ notifications, handleClearNotifications, loading }} />;
            case 'settings':
                return <SettingsTab {...{ settings, setSettings, passwordForm, setPasswordForm, showPassword, setShowPassword, handleChangePassword, notificationPrefs, setNotificationPrefs, handleUpdateNotificationPrefs, loading }} />;
            default:
                return null;
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#041216] text-slate-100 flex flex-col font-sans">
            {/* Top Navigation Bar */}
            <header className="bg-[#071c22] border-b border-[#123841]/50 text-white sticky top-0 z-50 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                    <span className="font-serif text-xl md:text-2xl tracking-wide font-semibold text-gold">Vezhambal</span>
                    {/* <span className="text-[10px] uppercase tracking-widest bg-gold/25 px-2 py-0.5 rounded text-gold-light font-medium hidden sm:inline-block border border-gold/30">Guest Portal</span> */}
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs md:text-sm text-slate-350 hover:text-white hover:bg-white/5 transition-all font-semibold"
                    >
                        <Home size={15} /> <span className="hidden md:inline">Back to Resort</span>
                    </button>
                    <button
                        onClick={() => { logout(); navigate('/'); }}
                        className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs md:text-sm bg-red-500/20 hover:bg-red-500/35 text-red-100 hover:text-white transition-all font-semibold"
                    >
                        <LogOut size={15} /> <span className="hidden md:inline">Logout</span>
                    </button>
                </div>
            </header>

            <div className="flex-grow flex flex-col lg:flex-row max-w-[1600px] w-full mx-auto p-3 sm:p-5 md:p-6 lg:p-8 gap-4 sm:gap-6 md:gap-8">
                {/* Sticky Left Sidebar (Desktop) */}
                <aside className="hidden lg:flex flex-col w-80 bg-[#071c22]/90 border border-[#123841]/40 rounded-2xl p-6 shadow-sm sticky top-24 h-[calc(100vh-8rem)]">
                    {/* User Card */}
                    <div className="flex flex-col items-center text-center pb-6 border-b border-[#123841]/30">
                        <div className="relative group mb-4">
                            <div className="w-24 h-24 rounded-full p-0.5 bg-gradient-to-tr from-gold to-[#1b6b5f] shadow-md">
                                <div className="w-full h-full rounded-full bg-[#041216] overflow-hidden flex items-center justify-center">
                                    {profileForm.avatar ? (
                                        <img src={profileForm.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon size={40} className="text-gold" />
                                    )}
                                </div>
                            </div>
                            <label className="absolute bottom-0 right-0 bg-gold text-[#041216] p-2 rounded-full cursor-pointer hover:bg-white transition-colors shadow-md group-hover:scale-105">
                                <Upload size={14} className="stroke-[2.5]" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                            </label>
                        </div>
                        <h3 className="font-serif text-xl font-bold text-white">{profileForm.name}</h3>
                        <p className="text-xs text-slate-400 mb-3 break-all px-2">{profileForm.email}</p>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="flex-1 mt-6 space-y-1 overflow-y-auto">
                        {Object.entries(TAB_CONFIG).map(([key, { icon: Icon, label }]) => {
                            const isActive = activeTab === key;
                            return (
                                <button
                                    key={key}
                                    onClick={() => setActiveTab(key)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                                        isActive
                                            ? 'bg-gold/10 text-gold shadow-sm font-semibold border-l-2 border-gold'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-[#0b2830]'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon size={18} className={isActive ? 'text-gold' : 'text-slate-500 group-hover:text-slate-350'} />
                                        <span>{label}</span>
                                    </div>
                                    <ChevronRight size={16} className={`transition-transform duration-300 ${isActive ? 'translate-x-0.5 text-gold' : 'opacity-0 group-hover:opacity-100 translate-x-0 text-slate-500'}`} />
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="flex-grow min-w-0 flex flex-col gap-4 sm:gap-6">
                    {/* Compact Profile Header (Mobile/Tablet Only) */}
                    <div className="lg:hidden bg-[#071c22]/90 border border-[#123841]/40 p-4 rounded-2xl shadow-sm flex items-center gap-3 sm:gap-4">
                        <div className="relative flex-shrink-0">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0.5 bg-gradient-to-tr from-gold to-[#1b6b5f] shadow-sm">
                                <div className="w-full h-full rounded-full bg-[#041216] overflow-hidden flex items-center justify-center">
                                    {profileForm.avatar ? (
                                        <img src={profileForm.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon size={24} className="text-gold" />
                                    )}
                                </div>
                            </div>
                            <label className="absolute bottom-0 right-0 bg-gold text-[#041216] p-1 rounded-full cursor-pointer hover:bg-white transition-colors shadow-sm">
                                <Upload size={10} className="stroke-[2.5]" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                            </label>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-serif text-base sm:text-lg font-bold text-white truncate">{profileForm.name}</h3>
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gold bg-gold/10 rounded-full border border-gold/20">
                                    <Star size={9} className="fill-gold text-gold" /> Premium
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 break-all">{profileForm.email}</p>
                        </div>
                    </div>

                    {/* Mobile Custom Tab Selector Dropdown */}
                    <div className="lg:hidden relative sticky top-16 z-40">
                        <button
                            onClick={() => setShowTabDropdown(!showTabDropdown)}
                            className="w-full bg-[#071c22]/90 border border-[#123841]/55 rounded-xl px-4 py-3 flex items-center justify-between text-sm font-semibold text-slate-100 shadow-sm focus:outline-none"
                        >
                            <div className="flex items-center gap-2.5">
                                {(() => {
                                    const ActiveIcon = TAB_CONFIG[activeTab]?.icon || UserIcon;
                                    return <ActiveIcon size={16} className="text-gold" />;
                                })()}
                                <span>{TAB_CONFIG[activeTab]?.label}</span>
                            </div>
                            <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${showTabDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {showTabDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute left-0 right-0 mt-2 bg-[#071c22] border border-[#123841]/60 rounded-xl shadow-xl overflow-hidden z-50 divide-y divide-[#123841]/30"
                                >
                                    {Object.entries(TAB_CONFIG).map(([key, { icon: Icon, label }]) => {
                                        const isActive = activeTab === key;
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => {
                                                    setActiveTab(key);
                                                    setShowTabDropdown(false);
                                                }}
                                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all text-left ${
                                                    isActive
                                                        ? 'bg-gold/10 text-gold font-bold'
                                                        : 'text-slate-300 hover:text-white hover:bg-[#0b2830]'
                                                }`}
                                            >
                                                <Icon size={16} className={isActive ? 'text-gold' : 'text-slate-500'} />
                                                <span>{label}</span>
                                            </button>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Active Tab Panel */}
                    <div className="bg-[#071c22]/40 backdrop-blur-md border border-[#123841]/40 rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8 flex-grow">
                        {loading && activeTab !== 'bookings' ? (
                            <div className="space-y-4 py-8">
                                <div className="h-6 w-32 animate-pulse rounded-md bg-[#123841]/60" />
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="h-36 rounded-2xl bg-[#09252e]/50 animate-pulse" />
                                    <div className="h-36 rounded-2xl bg-[#09252e]/50 animate-pulse" />
                                </div>
                                <div className="h-44 rounded-2xl bg-[#09252e]/50 animate-pulse" />
                            </div>
                        ) : (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="h-full"
                                >
                                    {renderContent()}
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

// Profile Tab Component
const ProfileTab = ({ profileForm, setProfileForm, editingProfile, setEditingProfile, handleUpdateProfile, loading }) => {
    return (
        <div className="w-full mx-auto font-sans">
            {/* Details Card */}
            <div className="border border-[#123841]/30 rounded-2xl p-4 sm:p-5 md:p-6 bg-[#09252e]/80 shadow-sm text-slate-100">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#123841]/30">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-gold/10 text-gold rounded-lg">
                            <UserIcon size={20} />
                        </div>
                        <h3 className="font-serif text-lg sm:text-xl font-bold text-white">Personal Details</h3>
                    </div>
                    {!editingProfile && (
                        <button
                            onClick={() => setEditingProfile(true)}
                            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gold/30 hover:border-gold/50 text-gold hover:bg-gold/5 transition-all"
                        >
                            <Edit2 size={13} /> Edit
                        </button>
                    )}
                </div>

                {editingProfile ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Full Name</label>
                            <input
                                type="text"
                                value={profileForm.name}
                                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                className="w-full px-4 py-2.5 border border-[#123841]/65 rounded-xl bg-[#041216] focus:bg-[#071c22] focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all text-sm text-slate-100"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Email Address</label>
                            <input
                                type="email"
                                value={profileForm.email}
                                disabled
                                className="w-full px-4 py-2.5 border border-[#123841]/40 rounded-xl bg-[#041216]/50 text-slate-400/60 cursor-not-allowed text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Phone Number</label>
                            <PhoneInput
                                value={profileForm.phone}
                                onChange={(val) => setProfileForm({ ...profileForm, phone: val })}
                                selectClassName="!border-[#123841]/65 !rounded-l-xl !bg-[#041216] focus:!bg-[#071c22] focus:!ring-gold focus:!border-gold !text-slate-100 !h-auto !py-2.5"
                                inputClassName="!border-[#123841]/65 !rounded-r-xl !bg-[#041216] focus:!bg-[#071c22] focus:!ring-gold focus:!border-gold !text-slate-100 !h-auto !py-2.5"
                                dropdownClassName="!bg-[#041216] !border-[#123841]/60 !text-slate-200"
                                placeholder="Enter phone number"
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleUpdateProfile}
                                disabled={loading}
                                className="flex-grow md:flex-grow-0 px-5 py-2.5 bg-gold hover:bg-gold-dark text-[#041216] font-bold rounded-xl text-sm transition-all disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin inline mr-1.5" size={16} /> : 'Save Changes'}
                            </button>
                            <button
                                onClick={() => setEditingProfile(false)}
                                className="flex-grow md:flex-grow-0 px-5 py-2.5 border border-[#123841] hover:bg-[#0c2e39] text-slate-300 rounded-xl text-sm font-semibold transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:grid sm:grid-cols-3 py-1.5 sm:items-center">
                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Full Name</span>
                            <span className="sm:col-span-2 text-sm font-medium text-slate-200 mt-0.5 sm:mt-0">{profileForm.name || 'Not Provided'}</span>
                        </div>
                        <div className="flex flex-col sm:grid sm:grid-cols-3 py-1.5 sm:items-center border-t border-[#123841]/30">
                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Email</span>
                            <span className="sm:col-span-2 text-sm font-medium text-slate-200 break-all mt-0.5 sm:mt-0">{profileForm.email}</span>
                        </div>
                        <div className="flex flex-col sm:grid sm:grid-cols-3 py-1.5 sm:items-center border-t border-[#123841]/30">
                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Phone</span>
                            <span className="sm:col-span-2 text-sm font-medium text-slate-200 mt-0.5 sm:mt-0">{profileForm.phone || 'Add a phone number'}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Bookings Tab Component
const BookingsTab = ({ filteredBookings, bookingFilter, setBookingFilter, selectedBooking, setSelectedBooking, handleCancelBooking, loading }) => {
    return (
        <div className="space-y-6 text-slate-100">
            <div className="flex gap-2 p-1 bg-[#041216]/50 border border-[#123841]/40 rounded-xl max-w-xs">
                {['all', 'upcoming', 'past'].map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setBookingFilter(filter)}
                        className={`flex-grow py-1.5 text-xs font-semibold rounded-lg transition-all capitalize ${
                            bookingFilter === filter
                                ? 'bg-gold text-[#041216] shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {filteredBookings.length === 0 ? (
                <div className="text-center py-12 md:py-16 bg-[#09252e]/40 rounded-2xl border border-dashed border-[#123841]/50 p-4 sm:p-6 text-slate-100">
                    <Calendar size={40} className="mx-auto text-gold/30 mb-3" />
                    <h3 className="font-serif text-lg font-bold text-white mb-1">No {bookingFilter === 'upcoming' ? 'Upcoming' : bookingFilter === 'past' ? 'Past' : ''} Bookings</h3>
                    <p className="text-sm text-slate-400 max-w-sm mx-auto mb-5">Start planning your next luxury retreat at our seaside haven.</p>
                    <a href="/rooms" className="inline-flex items-center justify-center px-5 py-2 bg-gold hover:bg-gold-dark text-[#041216] rounded-xl text-sm font-bold transition-all shadow-sm">
                        Explore Stays
                    </a>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredBookings.map((booking) => {
                        const checkIn = new Date(booking.checkInDate);
                        const checkOut = new Date(booking.checkOutDate);
                        const isUpcoming = checkIn > new Date() && !booking.isCancelled;
                        const duration = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
                        const isExpanded = selectedBooking?._id === booking._id;
                        const roomImage = booking.room?.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80';

                        return (
                            <div
                                key={booking._id}
                                className={`border rounded-2xl bg-[#09252e]/80 transition-all overflow-hidden cursor-pointer ${
                                    isExpanded
                                        ? 'border-gold shadow-md ring-1 ring-gold/20'
                                        : 'border-[#123841]/30 hover:border-gold/40 hover:shadow-sm'
                                }`}
                                onClick={() => setSelectedBooking(isExpanded ? null : booking)}
                            >
                                <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4">
                                    <div className="w-full sm:w-24 h-28 sm:h-20 rounded-xl overflow-hidden bg-[#041216] flex-shrink-0 border border-[#123841]/30">
                                        <img src={roomImage} alt="Room" className="w-full h-full object-cover" />
                                    </div>

                                    <div className="flex-grow min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <h4 className="font-serif text-base md:text-lg font-bold text-white truncate">
                                                {booking.package ? `Package: ${booking.package.name}` : booking.room?.name}
                                            </h4>
                                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                booking.isCancelled
                                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                    : booking.paymentStatus === 'Completed'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                            }`}>
                                                {booking.isCancelled ? 'Cancelled' : booking.paymentStatus}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <Calendar size={13} className="text-slate-500" />
                                            <span>{checkIn.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                                            <span>—</span>
                                            <span>{checkOut.toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}</span>
                                            <span className="text-slate-600">•</span>
                                            <span>{duration} stay night{duration > 1 ? 's' : ''}</span>
                                        </div>
                                    </div>

                                    <div className="text-left md:text-right border-t border-[#123841]/30 md:border-t-0 pt-3 md:pt-0 flex md:flex-col justify-between items-center md:items-end">
                                        <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider block md:hidden">Total Cost</span>
                                        <div>
                                            <span className="text-xl md:text-2xl font-serif font-bold text-gold">${booking.totalPrice}</span>
                                            <span className="text-[10px] text-slate-500 block">All Taxes Incl.</span>
                                        </div>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="border-t border-[#123841]/30 bg-[#041216]/20"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="p-4 md:p-5 space-y-4 text-xs md:text-sm">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-[#041216]/40 p-4 rounded-xl border border-[#123841]/20">
                                                    <div>
                                                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Booking ID</span>
                                                        <span className="font-mono font-semibold text-slate-350 break-all">{booking._id}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Guests Allocation</span>
                                                        <span className="font-semibold text-slate-200">{booking.guests?.adults} Adults, {booking.guests?.children || 0} Children</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Lead Guest</span>
                                                        <span className="font-semibold text-slate-200">{booking.guestName || 'John Guest'}</span>
                                                    </div>
                                                    {booking.guestPhone && (
                                                        <div>
                                                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Contact Phone</span>
                                                            <span className="font-semibold text-slate-200">{booking.guestPhone}</span>
                                                        </div>
                                                    )}
                                                    {booking.guestEmail && (
                                                        <div>
                                                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Contact Email</span>
                                                            <span className="font-semibold text-slate-200 break-all">{booking.guestEmail}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {booking.specialRequests && (
                                                    <div className="bg-[#041216]/40 p-4 rounded-xl border border-[#123841]/20">
                                                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Special Requests</span>
                                                        <p className="text-slate-300 italic bg-[#09252e]/55 px-3 py-2 rounded-lg border border-[#123841]/25 text-xs">
                                                            "{booking.specialRequests}"
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="flex gap-2.5 pt-2 flex-wrap sm:flex-nowrap">
                                                    {isUpcoming && (
                                                        <>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCancelBooking(booking._id);
                                                                }}
                                                                disabled={loading}
                                                                className="flex-grow py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-semibold border border-red-500/20 disabled:opacity-50 text-xs text-center transition-colors"
                                                            >
                                                                Cancel Stay
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toast.info('Reschedule request sent to coordinator.');
                                                                }}
                                                                className="flex-grow py-2.5 bg-[#123841] hover:bg-[#1b6b5f] text-slate-200 rounded-xl font-semibold text-xs text-center transition-colors border border-[#123841]/40"
                                                            >
                                                                Modify Dates
                                                            </button>
                                                        </>
                                                    )}
                                                    {booking.isCancelled && (
                                                        <div className="w-full py-2.5 bg-[#041216]/30 text-slate-500 rounded-xl text-center font-medium text-xs border border-[#123841]/20">
                                                            This booking was cancelled and is pending refund.
                                                        </div>
                                                    )}
                                                    {!isUpcoming && !booking.isCancelled && (
                                                        <div className="w-full flex items-center justify-between bg-[#041216]/30 p-3 rounded-xl border border-[#123841]/20 gap-2 flex-wrap">
                                                            <span className="text-xs text-slate-400">Hope you enjoyed your time with us! Let us know how your stay went.</span>
                                                            <a href={`/rooms/${booking.room?._id}`} className="text-xs font-bold text-gold hover:underline whitespace-nowrap">
                                                                View Room Details
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// Payments Tab Component
const PaymentsTab = ({ payments, invoices, handleDownloadInvoice }) => {
    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start font-sans text-slate-100">
            <div className="xl:col-span-3 space-y-6">
                {/* Transactions Card */}
                <div className="border border-[#123841]/30 rounded-2xl p-4 sm:p-5 md:p-6 bg-[#09252e]/80 shadow-sm">
                    <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-[#123841]/30">
                        <div className="p-2 bg-gold/10 text-gold rounded-lg">
                            <CreditCard size={20} />
                        </div>
                        <h3 className="font-serif text-lg sm:text-xl font-bold text-white">Transaction History</h3>
                    </div>

                    <div className="space-y-3">
                        {payments.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-sm">No transaction records found.</div>
                        ) : (
                            <div>
                                <div className="hidden sm:block overflow-x-auto">
                                    <table className="w-full text-left text-sm border-collapse">
                                        <thead>
                                            <tr className="border-b border-[#123841]/30 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                                                <th className="pb-3 font-semibold">Date</th>
                                                <th className="pb-3 font-semibold">Amount</th>
                                                <th className="pb-3 font-semibold">Payment Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#123841]/20">
                                            {payments.map((payment, idx) => (
                                                <tr key={idx} className="hover:bg-[#041216]/35 transition-colors">
                                                    <td className="py-3 font-medium text-slate-300">
                                                        {new Date(payment.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                                                    </td>
                                                    <td className="py-3 font-bold text-gold">${payment.amount?.toFixed(2) || 'N/A'}</td>
                                                    <td className="py-3">
                                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                                            payment.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                                                            payment.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                                                            'bg-red-500/10 text-red-400'
                                                        }`}>
                                                            {payment.status || 'unknown'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="block sm:hidden space-y-2.5">
                                    {payments.map((payment, idx) => (
                                        <div key={idx} className="p-3 border border-[#123841]/30 rounded-xl bg-[#041216]/30 flex items-center justify-between text-xs">
                                            <div>
                                                <p className="font-semibold text-slate-200">
                                                    {new Date(payment.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                                                </p>
                                                <p className="text-[10px] text-slate-500 mt-0.5">ID: #{payment._id?.slice(-6) || idx + 1001}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gold">${payment.amount?.toFixed(2) || 'N/A'}</p>
                                                <span className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold capitalize mt-0.5 ${
                                                    payment.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                                                    payment.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                                                    'bg-red-500/10 text-red-400'
                                                }`}>
                                                    {payment.status || 'unknown'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Invoices Card */}
                <div className="border border-[#123841]/30 rounded-2xl p-4 sm:p-5 md:p-6 bg-[#09252e]/80 shadow-sm">
                    <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-[#123841]/30">
                        <div className="p-2 bg-gold/10 text-gold rounded-lg">
                            <Download size={20} />
                        </div>
                        <h3 className="font-serif text-lg sm:text-xl font-bold text-white">Receipts & Invoices</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {invoices.length === 0 ? (
                            <div className="col-span-2 text-center py-6 text-slate-400 text-sm">No downloadable invoices found.</div>
                        ) : (
                            invoices.map((invoice) => (
                                <div key={invoice.id} className="flex items-center justify-between p-3.5 border border-[#123841]/30 rounded-xl hover:border-gold/30 transition-all bg-[#041216]/40">
                                    <div className="min-w-0 mr-2">
                                        <p className="font-semibold text-slate-200 text-sm truncate">Invoice #{invoice.id}</p>
                                        <p className="text-xs text-slate-400">${invoice.amount?.toFixed(2)} • {new Date(invoice.date).toLocaleDateString()}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDownloadInvoice(invoice)}
                                        className="p-2 text-gold hover:bg-gold/10 rounded-lg transition-colors flex-shrink-0"
                                        title="Download Invoice PDF"
                                    >
                                        <Download size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>            
        </div>
    );
};

// Wishlist Tab Component
const WishlistTab = ({ wishlist, handleToggleWishlist, handleQuickRebook }) => {
    return (
        <div className="text-slate-100">
            <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-[#123841]/30">
                <div className="p-2 bg-red-500/10 text-red-400 rounded-lg">
                    <Heart size={20} className="fill-red-500/20 text-red-400" />
                </div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-white">My Saved Retreats</h3>
            </div>

            {wishlist.length === 0 ? (
                <div className="text-center py-12 md:py-16 bg-[#09252e]/40 rounded-2xl border border-dashed border-[#123841]/50 p-4 sm:p-6">
                    <Heart size={40} className="mx-auto text-gold/30 mb-3" />
                    <h3 className="font-serif text-lg font-bold text-white mb-1">Your Wishlist is Empty</h3>
                    <p className="text-sm text-slate-400 max-w-sm mx-auto mb-5">Keep track of your dream villas and suites by clicking the heart button while browsing.</p>
                    <a href="/rooms" className="inline-flex items-center justify-center px-5 py-2 bg-gold hover:bg-gold-dark text-[#041216] rounded-xl text-sm font-bold transition-all shadow-sm">
                        Browse Luxury Stays
                    </a>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {wishlist.map((room) => {
                        const roomImage = room.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80';
                        return (
                            <div
                                key={room._id}
                                className="group border border-[#123841]/30 rounded-2xl overflow-hidden hover:shadow-md transition-all bg-[#09252e]/80 flex flex-col justify-between"
                            >
                                <div className="h-44 md:h-48 overflow-hidden bg-[#041216] relative border-b border-[#123841]/30">
                                    <img
                                        src={roomImage}
                                        alt={room.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <button
                                        onClick={() => handleToggleWishlist(room._id)}
                                        className="absolute top-3 right-3 p-2 rounded-full bg-[#041216]/85 backdrop-blur-sm text-red-400 shadow-sm hover:scale-105 hover:bg-[#041216] transition-all"
                                        title="Remove from wishlist"
                                    >
                                        <Heart size={16} className="fill-red-500 text-red-500" />
                                    </button>
                                </div>
                                <div className="p-4 flex flex-col justify-between flex-grow">
                                    <div className="mb-4">
                                        <h4 className="font-serif text-lg font-bold text-white group-hover:text-gold transition-colors line-clamp-1">{room.name}</h4>
                                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{room.description}</p>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#123841]/20 mt-auto">
                                        <div>
                                            <span className="text-base font-serif font-bold text-gold">${room.pricePerNight}</span>
                                            <span className="text-[10px] text-slate-500 block">/ night</span>
                                        </div>
                                        <button
                                            onClick={() => handleQuickRebook(room)}
                                            className="px-4 py-1.5 bg-gold hover:bg-gold-dark text-[#041216] rounded-lg text-xs font-bold transition-all shadow-sm"
                                        >
                                            Book Stay
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// Reviews Tab Component
const ReviewsTab = ({ reviews, bookings, writingReview, setWritingReview, reviewForm, setReviewForm, handleSubmitReview, handleDeleteReview, loading }) => {
    const bookingsEligibleForReview = bookings.filter(b => {
        const hasReview = reviews.some(r => r.bookingId === b._id);
        return !hasReview && new Date(b.checkOutDate) < new Date() && !b.isCancelled;
    });

    return (
        <div className="space-y-6 text-slate-100">
            <div className="flex items-center gap-2.5 pb-4 mb-2 border-b border-[#123841]/30">
                <div className="p-2 bg-gold/10 text-gold rounded-lg">
                    <Star size={20} className="fill-gold text-gold" />
                </div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-white">Reviews & Feedback</h3>
            </div>

            {/* Stays to Review Card */}
            {bookingsEligibleForReview.length > 0 && (
                <div className="bg-[#cfe8e3]/10 border border-[#9dcac1]/20 p-4 md:p-5 rounded-2xl">
                    <h4 className="font-serif text-base font-bold text-gold mb-3">Share Your Experience</h4>
                    <p className="text-xs text-slate-350 mb-4">You have {bookingsEligibleForReview.length} completed stays eligible for review. Help other travelers find their perfect stay!</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {bookingsEligibleForReview.map((booking) => (
                            <button
                                key={booking._id}
                                onClick={() => setWritingReview(booking._id)}
                                className="text-left p-3.5 bg-[#09252e] border border-[#123841]/30 rounded-xl hover:border-gold transition-all shadow-sm hover:shadow"
                            >
                                <p className="font-serif font-bold text-white text-sm">{booking.room?.name || 'Luxury Resort Stay'}</p>
                                <p className="text-[10px] text-slate-400 mt-1">Checked out {new Date(booking.checkOutDate).toLocaleDateString()}</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Write Review Editor */}
            <AnimatePresence>
                {writingReview && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="border border-gold/30 rounded-2xl p-5 md:p-6 bg-[#041216]/40 shadow-inner space-y-4"
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-[#123841]/20">
                            <h4 className="font-serif text-base font-bold text-white">Write Stay Review</h4>
                            <button onClick={() => setWritingReview(null)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Rating</label>
                                <div className="flex gap-1.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                            className="transition-transform hover:scale-110 font-sans"
                                        >
                                            <Star
                                                size={24}
                                                className={star <= reviewForm.rating ? 'fill-gold text-gold' : 'text-slate-600'}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Review Details</label>
                                <textarea
                                    value={reviewForm.comment}
                                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                    maxLength={500}
                                    className="w-full px-4 py-3 border border-[#123841]/60 rounded-xl bg-[#041216] focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all text-xs resize-none text-slate-100"
                                    rows={4}
                                    placeholder="Tell us about the service, amenities, comfort, or anything that made your stay special..."
                                />
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-[10px] text-slate-550">Keep feedback respectful and constructive.</span>
                                    <span className="text-[10px] text-slate-550">{reviewForm.comment.length}/500</span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => handleSubmitReview(writingReview)}
                                    disabled={loading}
                                    className="flex-grow px-4 py-2.5 bg-gold hover:bg-gold-dark text-[#041216] rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="animate-spin inline mr-1.5" size={14} /> : 'Submit Review'}
                                </button>
                                <button
                                    onClick={() => setWritingReview(null)}
                                    className="flex-grow px-4 py-2 border border-[#123841] hover:bg-[#0c2e39] text-slate-300 rounded-xl text-xs font-semibold transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List of Reviews */}
            <div>
                <h4 className="font-serif text-base font-bold text-white mb-4">Past Stays Reviews</h4>
                {reviews.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">You haven't submitted any reviews yet.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {reviews.map((review) => (
                            <div key={review._id} className="p-4 border border-[#123841]/30 rounded-xl bg-[#09252e]/80 shadow-sm hover:shadow-md transition-shadow relative group">
                                <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#123841]/20">
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={14} className={i < review.rating ? 'fill-gold text-gold' : 'text-slate-700'} />
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => handleDeleteReview(review._id)}
                                        className="text-red-400 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded transition-all"
                                        title="Delete review"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <p className="text-xs text-slate-200 italic font-medium leading-relaxed">"{review.comment}"</p>
                                <p className="text-[10px] text-slate-500 mt-3 flex justify-between">
                                    <span>Submitted review</span>
                                    <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Notifications Tab Component
const NotificationsTab = ({ notifications, handleClearNotifications, loading }) => {
    return (
        <div className="max-w-2xl mx-auto border border-[#123841]/30 rounded-2xl p-4 sm:p-5 md:p-6 bg-[#09252e]/80 shadow-sm text-slate-100 font-sans">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#123841]/30">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-gold/10 text-gold rounded-lg">
                        <Bell size={20} />
                    </div>
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-white">Recent Notifications</h3>
                </div>
                {notifications.length > 0 && (
                    <button
                        onClick={handleClearNotifications}
                        className="text-xs font-semibold text-gold hover:text-gold-dark hover:underline"
                    >
                        Clear All
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                    <BellOff size={32} className="mx-auto text-gold/30 mb-2" />
                    <p>No new notifications yet.</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {notifications.map((notif, idx) => (
                        <div key={idx} className="p-3 border border-[#123841]/25 hover:border-gold/20 rounded-xl flex items-start gap-3 bg-[#041216]/50 transition-colors">
                            <div className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-200 text-xs">{notif.title}</p>
                                <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">{notif.message}</p>
                                <p className="text-[9px] text-slate-500 mt-1.5">{new Date(notif.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Settings Tab Component
const SettingsTab = ({ settings, setSettings, passwordForm, setPasswordForm, showPassword, setShowPassword, handleChangePassword, notificationPrefs, setNotificationPrefs, handleUpdateNotificationPrefs, loading }) => {
    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start font-sans text-slate-100">
            {/* Left Column */}
            <div className="space-y-6">
                {/* Profile Security (Password Change) */}
                <div className="border border-[#123841]/30 rounded-2xl p-4 sm:p-5 md:p-6 bg-[#09252e]/80 shadow-sm">
                    <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-[#123841]/30">
                        <div className="p-2 bg-gold/10 text-gold rounded-lg">
                            <Lock size={20} />
                        </div>
                        <h3 className="font-serif text-lg sm:text-xl font-bold text-white">Change Password</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Current Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={passwordForm.current}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-[#123841]/65 rounded-xl bg-[#041216] focus:bg-[#071c22] focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all text-sm pr-10 text-slate-100"
                                    placeholder="Enter current password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">New Password</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={passwordForm.new}
                                onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                                className="w-full px-4 py-2.5 border border-[#123841]/65 rounded-xl bg-[#041216] focus:bg-[#071c22] focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all text-sm text-slate-100"
                                placeholder="Min 6 characters"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Confirm New Password</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={passwordForm.confirm}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                                className="w-full px-4 py-2.5 border border-[#123841]/65 rounded-xl bg-[#041216] focus:bg-[#071c22] focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all text-sm text-slate-100"
                                placeholder="Re-enter new password"
                            />
                        </div>
                        <button
                            onClick={handleChangePassword}
                            disabled={loading}
                            className="w-full mt-2 px-5 py-2.5 bg-gold hover:bg-gold-dark text-[#041216] font-bold rounded-xl text-sm transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin inline mr-1.5" size={16} /> : 'Update Password'}
                        </button>
                    </div>
                </div>

                {/* Interface Preferences */}
                <div className="border border-[#123841]/30 rounded-2xl p-4 sm:p-5 md:p-6 bg-[#09252e]/80 shadow-sm">
                    <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-[#123841]/30">
                        <div className="p-2 bg-gold/10 text-gold rounded-lg">
                            <Globe size={20} />
                        </div>
                        <h3 className="font-serif text-lg sm:text-xl font-bold text-white">Portal Language</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Interface Language</label>
                            <select
                                value={settings.language}
                                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                                className="w-full px-4 py-2.5 border border-[#123841]/60 rounded-xl bg-[#041216] focus:bg-[#071c22] focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all text-xs text-slate-200"
                            >
                                <option value="en">English (US)</option>
                                <option value="es">Español (ES)</option>
                                <option value="fr">Français (FR)</option>
                                <option value="de">Deutsch (DE)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
                {/* Notification Delivery Channels */}
                <div className="border border-[#123841]/30 rounded-2xl p-4 sm:p-5 md:p-6 bg-[#09252e]/80 shadow-sm">
                    <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-[#123841]/30">
                        <div className="p-2 bg-gold/10 text-gold rounded-lg">
                            <Bell size={20} />
                        </div>
                        <h3 className="font-serif text-lg sm:text-xl font-bold text-white">Notification Channels</h3>
                    </div>

                    <div className="space-y-3.5">
                        {[
                            { key: 'bookingUpdates', label: 'Stay Updates', desc: 'Alerts regarding booking confirmations, status changes, and billing details.' },
                            { key: 'offers', label: 'Privilege Club Offers', desc: 'Exclusive members-only seasonal rates and promotion announcements.' },
                            { key: 'checkInReminders', label: 'Guest Itinerary Reminders', desc: 'Pre-checkin updates and helpful guidelines prior to check-in.' },
                            { key: 'reviews', label: 'Post-Stay Feedback', desc: 'Feedback invitation and stay rating opportunities.' },
                            { key: 'email', label: 'Primary Email Updates', desc: 'Receive copy transcripts and billing PDF copies direct via email.' }
                        ].map(({ key, label, desc }) => (
                            <label key={key} className="flex items-start gap-3 p-3 border border-[#123841]/25 hover:border-gold/20 rounded-xl cursor-pointer bg-[#041216]/35 hover:bg-[#041216]/55 transition-all">
                                <input
                                    type="checkbox"
                                    checked={notificationPrefs[key]}
                                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, [key]: e.target.checked })}
                                    className="mt-0.5 w-4 h-4 rounded border-[#123841]/60 text-[#041216] focus:ring-gold bg-[#041216]"
                                />
                                <div className="min-w-0">
                                    <p className="font-semibold text-white text-xs">{label}</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">{desc}</p>
                                </div>
                            </label>
                        ))}

                        <button
                            onClick={handleUpdateNotificationPrefs}
                            disabled={loading}
                            className="w-full mt-4 px-5 py-2.5 bg-gold hover:bg-gold-dark text-[#041216] font-bold rounded-xl text-xs transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin inline mr-1.5" size={14} /> : 'Save Channels'}
                        </button>
                    </div>
                </div>

                {/* Privacy Card */}
                <div className="border border-[#123841]/30 rounded-2xl p-4 sm:p-5 md:p-6 bg-[#09252e]/80 shadow-sm">
                    <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-[#123841]/30">
                        <div className="p-2 bg-gold/10 text-gold rounded-lg">
                            <Shield size={20} />
                        </div>
                        <h3 className="font-serif text-lg sm:text-xl font-bold text-white">Privacy & Discretion</h3>
                    </div>

                    <div className="space-y-3">
                        <label className="flex items-start gap-3 p-3 border border-[#123841]/25 hover:border-gold/20 rounded-xl cursor-pointer bg-[#041216]/35 hover:bg-[#041216]/55 transition-all">
                            <input
                                type="checkbox"
                                checked={settings.privateProfile}
                                onChange={(e) => setSettings({ ...settings, privateProfile: e.target.checked })}
                                className="mt-0.5 w-4 h-4 rounded border-[#123841]/60 text-[#041216] focus:ring-gold bg-[#041216]"
                            />
                            <div>
                                <p className="font-semibold text-white text-xs">Private Member Account</p>
                                <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">Hide booking presence and stay records from standard guest matching suggestions.</p>
                            </div>
                        </label>

                        <label className="flex items-start gap-3 p-3 border border-[#123841]/25 hover:border-gold/20 rounded-xl cursor-pointer bg-[#041216]/35 hover:bg-[#041216]/55 transition-all">
                            <input
                                type="checkbox"
                                checked={settings.emailSubscription}
                                onChange={(e) => setSettings({ ...settings, emailSubscription: e.target.checked })}
                                className="mt-0.5 w-4 h-4 rounded border-[#123841]/60 text-[#041216] focus:ring-gold bg-[#041216]"
                            />
                            <div>
                                <p className="font-semibold text-white text-xs">Marketing & Newsletter Subscription</p>
                                <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">Deliver member newsletters and updates about new resort properties, expansions, and exclusive promotions.</p>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="border border-red-500/20 rounded-2xl p-4 sm:p-5 md:p-6 bg-red-950/20 shadow-sm space-y-4">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-red-500/20 text-red-400">
                        <AlertCircle size={20} />
                        <h3 className="font-serif text-base sm:text-lg font-bold">Security Action</h3>
                    </div>
                    <p className="text-xs text-red-200/80 leading-normal">
                        Permanently delete your Vezhambal Resort guest account and all history records. This action is immediate and cannot be recovered.
                    </p>
                    <button
                        onClick={() => {
                            if (window.confirm('WARNING: Are you sure you want to permanently delete your account? This action is irreversible and all your booking history will be lost.')) {
                                toast.error('Account deletion requires contacting Resort Support directly. Ref: CODE_DEL_GUEST.');
                            }
                        }}
                        className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                        Request Account Deletion
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
