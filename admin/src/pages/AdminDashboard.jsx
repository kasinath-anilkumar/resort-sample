import React, { useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
    LayoutDashboard,
    BedDouble,
    Check,
    CalendarCheck,
    Package,
    Users,
    Star,
    Settings,
    LogOut,
    TrendingUp,
    Menu,
    X
} from 'lucide-react';

import API from '../api';
import { AuthContext } from '../context/AuthContext';
import { DashboardSkeleton } from '../components/LoadingSkeleton';

import OverviewTab from './OverviewTab';
import AnalyticsTab from './AnalyticsTab';
import RoomInventoryTab from './RoomInventoryTab';
import RoomManagementTab from './RoomManagementTab';
import BookingsTab from './BookingsTab';
import PackagesTab from './PackagesTab';
import UsersTab from './UsersTab';
import ReviewsTab from './ReviewsTab';
import SettingsTab from './SettingsTab';

const AdminDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('Overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const [stats, setStats] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [amenities, setAmenities] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [expandedBookingId, setExpandedBookingId] = useState(null);
    const [users, setUsers] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [packages, setPackages] = useState([]);
    const [resortSettings, setResortSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if user is admin
    if (!user || !user.isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f7faf8]">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-slate-950 mb-4">Access Denied</h2>
                    <p className="text-slate-600 mb-6">You need admin privileges to access this page.</p>
                    <a href="/login" className="bg-[#1b6b5f] text-white px-6 py-3 rounded-lg hover:bg-[#15564d] transition-colors">
                        Login as Admin
                    </a>
                </div>
            </div>
        );
    }

    const authConfig = useMemo(() => {
        if (!user || !user.token) return {};
        return { headers: { Authorization: `Bearer ${user.token}` } };
    }, [user]);

    const fetchAdminData = async () => {
        setLoading(true);
        try {
            // Public endpoints (no auth required)
            const [roomsRes, typesRes, amenitiesRes, packagesRes] = await Promise.all([
                API.get('/rooms'),
                API.get('/room-types'),
                API.get('/amenities'),
                API.get('/packages')
            ]);

            setRooms(roomsRes.data);
            setRoomTypes(typesRes.data);
            setAmenities(amenitiesRes.data);
            setPackages(packagesRes.data);

            // Admin-only endpoints (require auth)
            try {
                const [statsRes, bookingsRes, usersRes, reviewsRes, settingsRes] = await Promise.all([
                    API.get('/admin/stats', authConfig),
                    API.get('/bookings', authConfig),
                    API.get('/users', authConfig),
                    API.get('/reviews', authConfig),
                    API.get('/settings')
                ]);

                setStats(statsRes.data);
                setBookings(bookingsRes.data);
                setUsers(usersRes.data);
                setReviews(reviewsRes.data);
                setResortSettings(settingsRes.data);
            } catch (adminError) {
                console.error('Admin API Error:', adminError.response?.data || adminError.message);
                const status = adminError.response?.status;
                toast.error(`Admin data failed (${status || 'Network Error'}). Check if you are still logged in as Admin.`);
            }

        } catch (error) {
            console.error('Failed to fetch public data:', error);
            toast.error('Failed to load resort data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && user.token && user.isAdmin) {
            fetchAdminData();
        } else {
            setLoading(false);
        }
    }, [user]);

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;
        try {
            await API.put(`/bookings/${bookingId}/cancel`, {}, authConfig);
            toast.success('Booking cancelled successfully');
            fetchAdminData();
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message;
            toast.error(errorMsg || 'Failed to cancel booking');
        }
    };

    const handleRefundBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to process a refund for this booking?')) return;
        try {
            await API.post('/payments/refund', { bookingId }, authConfig);
            toast.success('Refund processed successfully');
            fetchAdminData();
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message;
            toast.error(errorMsg || 'Failed to process refund');
        }
    };

    const handleCheckInBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to check in this guest?')) return;
        try {
            await API.put(`/bookings/${bookingId}/checkin`, {}, authConfig);
            toast.success('Guest checked in successfully');
            fetchAdminData();
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message;
            toast.error(errorMsg || 'Failed to check in guest');
        }
    };

    const handleCheckOutBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to check out this guest?')) return;
        try {
            await API.put(`/bookings/${bookingId}/checkout`, {}, authConfig);
            toast.success('Guest checked out successfully');
            fetchAdminData();
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message;
            toast.error(errorMsg || 'Failed to check out guest');
        }
    };

    if (loading && !stats) {
        return <DashboardSkeleton />;
    }

    const navItems = [
        { id: 'Overview', icon: LayoutDashboard },
        { id: 'Analytics', icon: TrendingUp },
        { id: 'Room Inventory', icon: BedDouble },
        { id: 'Room Management', icon: Check },
        { id: 'Bookings', icon: CalendarCheck },
        { id: 'Packages', icon: Package },
        { id: 'Users', icon: Users },
        { id: 'Reviews', icon: Star },
        { id: 'Settings', icon: Settings }
    ];

    const SidebarContent = () => (
        <div className="flex flex-col justify-between h-full">
            <div>
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <p className="text-xl font-bold uppercase text-[#1b6b5f] font-serif">Vezhambal</p>
                        <p className="text-[10px] tracking-widest text-slate-400 uppercase font-bold mt-1 text-slate-400">Admin Panel</p>
                    </div>
                    <button 
                        type="button" 
                        onClick={() => setIsSidebarOpen(false)} 
                        className="lg:hidden p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-700 transition-colors"
                        aria-label="Close sidebar menu"
                    >
                        <X size={18} />
                    </button>
                </div>
                <nav className="p-3">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                                setActiveTab(item.id);
                                setIsSidebarOpen(false);
                            }}
                            className={`mb-2 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-bold uppercase transition ${activeTab === item.id
                                ? 'bg-[#1b6b5f] text-white'
                                : 'text-slate-600 hover:bg-[#e4fff6] hover:text-[#1b6b5f]'
                                }`}
                        >
                            <item.icon size={18} />
                            {item.id}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="p-3 border-t border-slate-200">
                <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-bold uppercase text-red-600 hover:bg-red-50 hover:text-red-700 transition"
                >
                    <LogOut size={18} />
                    Log Out
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-[#f7faf8] text-slate-900">
            {/* Desktop Sidebar - Left static layout */}
            <aside className="w-64 border-r border-slate-200 bg-white shadow-sm flex-shrink-0 sticky top-0 h-screen overflow-y-auto z-10 hidden lg:flex flex-col justify-between">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar - Slide over drawer */}
            <div className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${isSidebarOpen ? 'visible' : 'invisible'}`}>
                {/* Backdrop overlay */}
                <div 
                    className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setIsSidebarOpen(false)}
                />
                {/* Drawer Menu */}
                <aside className={`absolute inset-y-0 left-0 w-64 bg-white shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <SidebarContent />
                </aside>
            </div>

            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile Header Top-Bar */}
                <header className="lg:hidden flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 sticky top-0 z-20 shadow-sm flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors"
                            aria-label="Open sidebar menu"
                        >
                            <Menu size={20} />
                        </button>
                        <h1 className="text-lg font-bold font-serif text-[#1b6b5f] uppercase tracking-wide">
                            {activeTab}
                        </h1>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Admin
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-2">
                    <div className="max-w-full">
                        {activeTab === 'Overview' && (
                            <OverviewTab stats={stats} onSelectBooking={(booking) => {
                                setActiveTab('Bookings');
                                setExpandedBookingId(booking._id);
                            }} />
                        )}
                        {activeTab === 'Analytics' && (
                            <AnalyticsTab stats={stats} />
                        )}
                        {activeTab === 'Room Inventory' && (
                            <RoomInventoryTab rooms={rooms} roomTypes={roomTypes} amenities={amenities} refetch={fetchAdminData} authConfig={authConfig} />
                        )}
                        {activeTab === 'Room Management' && (
                            <RoomManagementTab roomTypes={roomTypes} amenities={amenities} refetch={fetchAdminData} authConfig={authConfig} />
                        )}
                        {activeTab === 'Bookings' && (
                            <BookingsTab 
                                bookings={bookings} 
                                expandedBookingId={expandedBookingId}
                                setExpandedBookingId={setExpandedBookingId}
                                onCancelBooking={handleCancelBooking} 
                                onRefundBooking={handleRefundBooking}
                                onCheckInBooking={handleCheckInBooking}
                                onCheckOutBooking={handleCheckOutBooking}
                            />
                        )}
                        {activeTab === 'Packages' && (
                            <PackagesTab packages={packages} refetch={fetchAdminData} authConfig={authConfig} />
                        )}
                        {activeTab === 'Users' && (
                            <UsersTab users={users} refetch={fetchAdminData} authConfig={authConfig} />
                        )}
                        {activeTab === 'Reviews' && (
                            <ReviewsTab reviews={reviews} refetch={fetchAdminData} authConfig={authConfig} />
                        )}
                        {activeTab === 'Settings' && (
                            <SettingsTab initialSettings={resortSettings} refetch={fetchAdminData} authConfig={authConfig} />
                        )}
                    </div>
                </div>
            </main>

            {/* BookingDetailsModal has been replaced by inline BookingsTab accordion */}
        </div>
    );
};

export default AdminDashboard;
