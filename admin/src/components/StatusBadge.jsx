import React from 'react';

const StatusBadge = ({ status }) => {
    const getStatusStyles = (status) => {
        switch (status) {
            case 'Completed':
                return 'bg-green-50 text-green-700 border border-green-200';
            case 'Confirmed':
                return 'bg-[#e4fff6] text-[#1b6b5f] border border-[#a2e7d7]';
            case 'Checked-In':
                return 'bg-teal-50 text-teal-700 border border-teal-200';
            case 'Checked-Out':
                return 'bg-blue-50 text-blue-700 border border-blue-200';
            case 'Cancelled':
                return 'bg-red-50 text-red-700 border border-red-200';
            case 'Expired':
                return 'bg-slate-100 text-slate-600 border border-slate-200';
            case 'Failed':
                return 'bg-rose-50 text-rose-700 border border-rose-200';
            case 'Refunded':
                return 'bg-orange-50 text-orange-700 border border-orange-200';
            case 'Pending':
            default:
                return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
        }
    };

    return (
        <span className={`rounded-md px-2 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider ${getStatusStyles(status)}`}>
            {status}
        </span>
    );
};

export default StatusBadge;
