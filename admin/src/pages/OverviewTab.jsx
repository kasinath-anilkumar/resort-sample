import React from 'react';
import { TrendingUp, CalendarCheck, BedDouble, Users } from 'lucide-react';
import StatCard from '../components/StatCard';
import Panel from '../components/Panel';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';

const OverviewTab = ({ stats, onSelectBooking }) => {
    if (!stats) return null;

    return (
        <div className="space-y-6">
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <StatCard icon={<TrendingUp />} label="Revenue" value={`$${stats.totalRevenue}`} />
                <StatCard icon={<CalendarCheck />} label="Bookings" value={stats.totalBookings} />
                <StatCard icon={<BedDouble />} label="Room Units" value={stats.totalRooms} />
                <StatCard icon={<Users />} label="Guests" value={stats.totalUsers} />
            </div>
            
            <Panel title="Recent Bookings" subtitle="Latest reservations and payment status.">
                <DataTable
                    headers={['Guest', 'Room', 'Total', 'Status', 'Actions']}
                    rows={stats.recentBookings.map((booking) => [
                        booking.user?.name || 'Guest',
                        booking.room?.name || 'Room',
                        `$${booking.totalPrice}`,
                        <StatusBadge key={booking._id} status={booking.paymentStatus} />,
                        <button
                            key={booking._id}
                            type="button"
                            onClick={() => onSelectBooking(booking)}
                            className="px-2.5 py-1 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors font-semibold uppercase tracking-wider"
                        >
                            Details
                        </button>
                    ])}
                />
            </Panel>
        </div>
    );
};

export default OverviewTab;
