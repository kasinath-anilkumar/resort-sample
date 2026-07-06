import React from 'react';
import { X } from 'lucide-react';

const BookingDetailsModal = ({ selectedBooking, onClose, onCancel, onRefund }) => {
    if (!selectedBooking) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl md:p-8 animate-in fade-in zoom-in-95 duration-200 text-left">
                {/* Close button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                    <X size={20} />
                </button>

                {/* Title */}
                <div className="border-b border-slate-100 pb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1b6b5f]">Booking Details</span>
                    <h3 className="mt-1 text-2xl font-semibold text-slate-950">
                        {selectedBooking.room?.name || 'Luxury Room'}
                    </h3>
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-tight mt-1">
                        ID: {selectedBooking._id}
                    </p>
                </div>

                {/* Booking Details Grid */}
                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* Guest Details */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Guest Information</h4>
                        <div className="mt-2 space-y-1">
                            <p className="text-sm font-semibold text-slate-900">
                                {selectedBooking.guestName || selectedBooking.user?.name || 'Guest'}
                            </p>
                            <p className="text-xs text-slate-500">
                                Email: {selectedBooking.guestEmail || selectedBooking.user?.email || 'N/A'}
                            </p>
                            {selectedBooking.guestPhone && (
                                <p className="text-xs text-slate-500">Phone: {selectedBooking.guestPhone}</p>
                            )}
                            <p className="text-xs text-slate-500 mt-1">
                                Booked: {new Date(selectedBooking.createdAt).toLocaleDateString()} at {new Date(selectedBooking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>

                    {/* Dates & Duration */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Stay Dates</h4>
                        <div className="mt-2 text-sm text-slate-800 space-y-1">
                            <p className="font-semibold">{new Date(selectedBooking.checkInDate).toLocaleDateString()} to {new Date(selectedBooking.checkOutDate).toLocaleDateString()}</p>
                            <p className="text-xs text-slate-500 font-medium">
                                {Math.ceil((new Date(selectedBooking.checkOutDate) - new Date(selectedBooking.checkInDate)) / (1000 * 60 * 60 * 24))} night(s)
                            </p>
                        </div>
                    </div>

                    {/* Guests count */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Guests</h4>
                        <div className="mt-2 text-sm text-slate-800 space-y-1">
                            <p className="font-semibold">
                                {selectedBooking.guests?.adults} Adults
                                {selectedBooking.guests?.extraAdults > 0 && ` (+${selectedBooking.guests.extraAdults} extra)`}
                            </p>
                            {selectedBooking.guests?.children > 0 && (
                                <p className="text-xs text-slate-500 font-medium">
                                    {selectedBooking.guests.children} Children (Free)
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Special Requests */}
                {selectedBooking.specialRequests && (
                    <div className="mt-6 border-t border-slate-100 pt-6">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Special Requests</h4>
                        <p className="mt-2 text-sm font-medium text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-150 italic">
                            "{selectedBooking.specialRequests}"
                        </p>
                    </div>
                )}

                {/* Payment Details */}
                <div className="mt-6 border-t border-slate-100 pt-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Payment Breakdown</h4>
                    <div className="mt-3 space-y-2">
                        <div className="flex justify-between text-sm text-slate-600">
                            <span>Nightly Room Base Rate</span>
                            <span>${selectedBooking.room?.pricePerNight} / night</span>
                        </div>
                        {selectedBooking.guests?.extraAdults > 0 && (
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Extra Guest Fee</span>
                                <span>
                                    +${selectedBooking.guests.extraAdults * (selectedBooking.room?.extraGuestCharge || 0)} / night
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold text-slate-900">
                            <span>Total Price Paid</span>
                            <span className="text-xl text-[#1b6b5f]">${selectedBooking.totalPrice}</span>
                        </div>
                        {selectedBooking.paymentIntentId && (
                            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-[11px] font-mono text-slate-500 break-all">
                                <p>Payment Intent ID: {selectedBooking.paymentIntentId}</p>
                                {selectedBooking.refundId && <p className="mt-1">Refund ID: {selectedBooking.refundId}</p>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions in Footer */}
                <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                    >
                        Close
                    </button>
                    {!selectedBooking.isCancelled && selectedBooking.paymentStatus !== 'Cancelled' && (
                        <>
                            <button
                                type="button"
                                onClick={() => onCancel(selectedBooking._id)}
                                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition"
                            >
                                Cancel Booking
                            </button>
                            {selectedBooking.paymentStatus === 'Completed' && (
                                <button
                                    type="button"
                                    onClick={() => onRefund(selectedBooking._id)}
                                    className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 transition"
                                >
                                    Process Refund
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingDetailsModal;
