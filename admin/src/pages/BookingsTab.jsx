import React, { useState } from 'react';
import Panel from '../components/Panel';
import StatusBadge from '../components/StatusBadge';
import { ChevronDown, User, Calendar, CreditCard, Clock, MessageSquare, ShieldAlert, Search } from 'lucide-react';

const BookingsTab = ({ 
    bookings, 
    expandedBookingId, 
    setExpandedBookingId, 
    onCancelBooking, 
    onRefundBooking,
    onCheckInBooking,
    onCheckOutBooking
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const toggleExpand = (id) => {
        setExpandedBookingId(expandedBookingId === id ? null : id);
    };

    // Filter bookings based on guest name, phone, email, full ID, room, or short reference code
    const filteredBookings = bookings.filter((booking) => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;

        const guestName = (booking.guestName || booking.user?.name || '').toLowerCase();
        const guestEmail = (booking.guestEmail || booking.user?.email || '').toLowerCase();
        const guestPhone = (booking.guestPhone || '').toLowerCase();
        const fullId = (booking._id || '').toLowerCase();
        const shortId = (booking._id ? booking._id.slice(-8) : '').toLowerCase();
        const roomName = (booking.room?.name || '').toLowerCase();

        return (
            guestName.includes(query) ||
            guestEmail.includes(query) ||
            guestPhone.includes(query) ||
            fullId.includes(query) ||
            shortId.includes(query) ||
            roomName.includes(query)
        );
    });

    return (
        <Panel title="All Bookings" subtitle="Reservation dates, payment status, and revenue.">
            <div className="space-y-4">
                {/* Search Bar widget */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search by Guest Name, Phone number, Email, Room, or Booking ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-xs sm:text-sm outline-none transition focus:border-[#1b6b5f]"
                    />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>

                <div className="space-y-3">
                    {filteredBookings.length === 0 ? (
                        <p className="text-sm text-slate-500 py-4 text-center">No bookings match your search.</p>
                    ) : (
                        filteredBookings.map((booking) => {
                        const isExpanded = expandedBookingId === booking._id;
                        const checkIn = new Date(booking.checkInDate);
                        const checkOut = new Date(booking.checkOutDate);
                        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
                        
                        return (
                            <div 
                                key={booking._id} 
                                className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                                    isExpanded 
                                        ? 'border-[#1b6b5f] bg-[#fdfefd] shadow-sm' 
                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                            >
                                {/* Accordion Header */}
                                <button
                                    type="button"
                                    onClick={() => toggleExpand(booking._id)}
                                    className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 text-left gap-3 focus:outline-none"
                                >
                                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 items-center">
                                        {/* Guest Info */}
                                        <div className="col-span-2 sm:col-span-1">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className="font-mono text-[9px] font-bold text-[#1b6b5f] bg-[#e4fff6] border border-[#a2e7d7] px-1.5 py-0.5 rounded shadow-sm">
                                                    #{booking._id.slice(-8).toUpperCase()}
                                                </span>
                                                <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-tight">
                                                    {booking.guestName || booking.user?.name || 'Guest'}
                                                </p>
                                            </div>
                                            <p className="text-[10px] sm:text-xs text-slate-400 truncate mt-0.5">
                                                {booking.guestEmail || booking.user?.email || 'No email'}
                                            </p>
                                        </div>

                                        {/* Room or Package Name */}
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{booking.package ? 'Package' : 'Room'}</p>
                                            <p className="text-xs sm:text-sm font-medium text-slate-700 truncate mt-0.5">
                                                {booking.package ? booking.package.name : (booking.room?.name || 'Luxury Room')}
                                            </p>
                                        </div>

                                        {/* Dates */}
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Stay Dates</p>
                                            <p className="text-xs sm:text-sm font-medium text-slate-700 leading-tight mt-0.5">
                                                {checkIn.toLocaleDateString()} - {checkOut.toLocaleDateString()}
                                            </p>
                                        </div>

                                        {/* Price & Status */}
                                        <div className="flex items-center gap-3 sm:justify-end">
                                            <div className="text-left sm:text-right">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Price</p>
                                                <p className="text-xs sm:text-sm font-semibold text-[#1b6b5f] mt-0.5">
                                                    ${booking.totalPrice}
                                                </p>
                                            </div>
                                             <div className="flex flex-col gap-1 items-start sm:items-end">
                                                 <div className="flex items-center gap-1.5">
                                                     <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Booking:</span>
                                                     <StatusBadge status={booking.bookingStatus || 'Pending'} />
                                                 </div>
                                                 <div className="flex items-center gap-1.5">
                                                     <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Payment:</span>
                                                     <StatusBadge status={booking.paymentStatus || 'Pending'} />
                                                 </div>
                                             </div>
                                        </div>
                                    </div>

                                    {/* Action Toggle Indicator */}
                                    <div className="flex items-center justify-between border-t border-slate-100 pt-2 sm:border-t-0 sm:pt-0 sm:pl-4">
                                        <span className="text-[10px] font-bold text-[#1b6b5f] sm:hidden">
                                            {isExpanded ? 'Hide details' : 'Show details'}
                                        </span>
                                        <div className={`p-1 rounded-full bg-slate-50 text-slate-400 hover:text-[#1b6b5f] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>
                                </button>

                                {/* Accordion Details Section */}
                                {isExpanded && (
                                    <div className="border-t border-slate-100 bg-[#fbfdfc] p-4 sm:p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                            {/* Column 1: Guest & Booking metadata */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-100 space-y-2">
                                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                                                    <User size={12} className="text-[#1b6b5f]" /> Guest & Booking Info
                                                </h4>
                                                <div className="space-y-1 text-xs text-slate-600">
                                                    {booking.package && (
                                                        <p><span className="font-semibold text-slate-700">Package Name:</span> {booking.package.name}</p>
                                                    )}
                                                    <p><span className="font-semibold text-slate-700">Guest Name:</span> {booking.guestName || booking.user?.name || 'Guest'}</p>
                                                    <p><span className="font-semibold text-slate-700">Email:</span> {booking.guestEmail || booking.user?.email || 'N/A'}</p>
                                                    {booking.guestPhone && <p><span className="font-semibold text-slate-700">Phone:</span> {booking.guestPhone}</p>}
                                                    <p><span className="font-semibold text-slate-700">Booking Ref:</span> <span className="font-mono text-xs font-bold text-[#1b6b5f]">#{booking._id.slice(-8).toUpperCase()}</span></p>
                                                    <p className="flex items-center gap-1 text-[10px] text-slate-400 mt-2">
                                                        <Clock size={12} /> Booked: {new Date(booking.createdAt).toLocaleDateString()} {new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Column 2: Stay Dates & Occupants */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-100 space-y-2">
                                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                                                    <Calendar size={12} className="text-[#1b6b5f]" /> Stay Details
                                                </h4>
                                                <div className="space-y-1 text-xs text-slate-600">
                                                     <p><span className="font-semibold text-slate-700">Nights:</span> {nights} night(s)</p>
                                                     <p><span className="font-semibold text-slate-700">Rooms Booked:</span> {booking.roomsBooked || 1}</p>
                                                     <p><span className="font-semibold text-slate-700">Adults:</span> {booking.guests?.adults} {booking.guests?.extraAdults > 0 && ` (+${booking.guests.extraAdults} extra)`}</p>
                                                     {booking.guests?.children > 0 && <p><span className="font-semibold text-slate-700">Children:</span> {booking.guests.children} (Free)</p>}
                                                </div>
                                            </div>

                                            {/* Column 3: Payment details */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-100 space-y-2">
                                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                                                    <CreditCard size={12} className="text-[#1b6b5f]" /> Payment Breakdown
                                                </h4>
                                                <div className="space-y-1 text-xs text-slate-600">
                                                    {booking.package ? (
                                                        <p className="flex justify-between">
                                                            <span>Package Base Price:</span>
                                                            <span className="font-medium">${booking.package.price}</span>
                                                        </p>
                                                    ) : (
                                                        <>
                                                            <p className="flex justify-between">
                                                                <span>Nightly Base Price:</span>
                                                                <span className="font-medium">${booking.room?.pricePerNight}</span>
                                                            </p>
                                                            {booking.guests?.extraAdults > 0 && (
                                                                <p className="flex justify-between">
                                                                    <span>Extra Guest Charge:</span>
                                                                    <span className="font-medium">+${booking.guests.extraAdults * (booking.room?.extraGuestCharge || 0)}</span>
                                                                </p>
                                                            )}
                                                        </>
                                                    )}
                                                    <div className="flex justify-between border-t border-slate-100 pt-1 text-xs font-bold text-slate-900 mt-1">
                                                        <span>Total Price Paid:</span>
                                                        <span className="text-[#1b6b5f]">${booking.totalPrice}</span>
                                                    </div>
                                                     {booking.paymentIntentId && (
                                                         <div className="mt-2 text-[9px] font-mono text-slate-400 bg-slate-50 p-1.5 rounded overflow-hidden">
                                                             <p className="truncate">Intent ID: {booking.paymentIntentId}</p>
                                                             {booking.refundId && <p className="truncate mt-0.5">Refund ID: {booking.refundId}</p>}
                                                         </div>
                                                     )}
                                                     {booking.razorpayOrderId && (
                                                         <div className="mt-2 text-[9px] font-mono text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100 overflow-hidden space-y-0.5">
                                                             <p className="truncate font-semibold text-slate-700">Razorpay Info</p>
                                                             <p className="truncate"><span className="text-slate-400">Order ID:</span> {booking.razorpayOrderId}</p>
                                                             {booking.razorpayPaymentId && <p className="truncate"><span className="text-slate-400">Payment ID:</span> {booking.razorpayPaymentId}</p>}
                                                             {booking.paymentMethod && <p className="truncate"><span className="text-slate-400">Method:</span> {booking.paymentMethod}</p>}
                                                             {booking.transactionDate && <p className="truncate"><span className="text-slate-400">Date:</span> {new Date(booking.transactionDate).toLocaleString()}</p>}
                                                         </div>
                                                     )}
                                                     {booking.refundStatus && booking.refundStatus !== 'None' && (
                                                         <div className="mt-2 text-[9px] font-mono text-slate-500 bg-orange-50/50 p-1.5 rounded border border-orange-100 overflow-hidden space-y-0.5">
                                                             <p className="truncate font-semibold text-orange-850">Refund ({booking.refundStatus})</p>
                                                             {booking.refundAmount > 0 && <p className="truncate"><span className="text-orange-600">Amount:</span> ${booking.refundAmount}</p>}
                                                             {booking.refundDate && <p className="truncate"><span className="text-orange-600">Date:</span> {new Date(booking.refundDate).toLocaleString()}</p>}
                                                             {booking.refundReason && <p className="truncate"><span className="text-orange-600">Reason:</span> {booking.refundReason}</p>}
                                                             {booking.refundId && <p className="truncate"><span className="text-orange-600">Refund ID:</span> {booking.refundId}</p>}
                                                         </div>
                                                     )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Special Requests */}
                                        {booking.specialRequests && (
                                            <div className="bg-white p-3 rounded-lg border border-slate-100 space-y-1.5">
                                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                                    <MessageSquare size={12} className="text-[#1b6b5f]" /> Special Requests
                                                </h4>
                                                <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded border border-slate-100">
                                                    "{booking.specialRequests}"
                                                </p>
                                            </div>
                                        )}

                                         {/* Actions Bar */}
                                         <div className="flex flex-wrap gap-2 justify-end pt-2">
                                             {/* Check-In Guest */}
                                             {booking.bookingStatus === 'Confirmed' && (
                                                 <button
                                                     type="button"
                                                     onClick={(e) => {
                                                         e.stopPropagation();
                                                         onCheckInBooking(booking._id);
                                                     }}
                                                     className="rounded-lg bg-teal-50 px-3.5 py-1.5 text-xs font-semibold text-teal-600 hover:bg-teal-100 transition"
                                                 >
                                                     Check-In Guest
                                                 </button>
                                             )}

                                             {/* Check-Out Guest */}
                                             {booking.bookingStatus === 'Checked-In' && (
                                                 <button
                                                     type="button"
                                                     onClick={(e) => {
                                                         e.stopPropagation();
                                                         onCheckOutBooking(booking._id);
                                                     }}
                                                     className="rounded-lg bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition"
                                                 >
                                                     Check-Out Guest
                                                 </button>
                                             )}

                                             {/* Cancel Booking (Only Pending/Confirmed) */}
                                             {['Pending', 'Confirmed'].includes(booking.bookingStatus) && (
                                                 <button
                                                     type="button"
                                                     onClick={(e) => {
                                                         e.stopPropagation();
                                                         onCancelBooking(booking._id);
                                                     }}
                                                     className="rounded-lg bg-red-50 px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
                                                 >
                                                     Cancel Booking
                                                 </button>
                                             )}

                                             {/* Process Refund (If completed and booking cancelled/expired) */}
                                             {booking.paymentStatus === 'Completed' && ['Cancelled', 'Expired'].includes(booking.bookingStatus) && (
                                                 <button
                                                     type="button"
                                                     onClick={(e) => {
                                                         e.stopPropagation();
                                                         onRefundBooking(booking._id);
                                                     }}
                                                     className="rounded-lg bg-orange-50 px-3.5 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-100 transition"
                                                 >
                                                     Process Refund
                                                 </button>
                                             )}

                                             {/* Visual Labels for Terminal States in details */}
                                             {booking.bookingStatus === 'Cancelled' && (
                                                 <span className="flex items-center gap-1 px-2.5 py-1 text-xs text-red-600 bg-red-50 rounded-lg font-semibold uppercase tracking-wider text-[10px] border border-red-200">
                                                     <ShieldAlert size={12} /> Cancelled
                                                 </span>
                                             )}
                                             {booking.bookingStatus === 'Expired' && (
                                                 <span className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-500 bg-slate-100 rounded-lg font-semibold uppercase tracking-wider text-[10px] border border-slate-200">
                                                     Expired
                                                 </span>
                                             )}
                                             {booking.bookingStatus === 'Checked-Out' && (
                                                 <span className="flex items-center gap-1 px-2.5 py-1 text-xs text-blue-600 bg-blue-50 rounded-lg font-semibold uppercase tracking-wider text-[10px] border border-blue-200">
                                                     Checked-Out
                                                 </span>
                                             )}
                                         </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    </Panel>
    );
};

export default BookingsTab;
