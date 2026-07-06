import React, { useMemo } from 'react';
import { DollarSign, Moon, ShieldAlert, Award } from 'lucide-react';
import Panel from '../components/Panel';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';

const AnalyticsTab = ({ stats }) => {
    if (!stats) return null;

    const { bookingsByStatus, monthlyTrends, roomPerformance, hospitalityMetrics, totalBookings, totalRooms } = stats;
    const metrics = hospitalityMetrics || { averageStayLength: 0, averageDailyRate: 0, cancellationRate: 0 };

    // Calculate estimated occupancy rate (occupancy room nights over 6 months / total room capacity over 6 months)
    const occupancyRate = useMemo(() => {
        if (!totalRooms || !totalBookings) return 0;
        const totalNightsBooked = totalBookings * metrics.averageStayLength;
        const totalCapacityNights = totalRooms * 180; // 6 months (180 days)
        const rate = (totalNightsBooked / totalCapacityNights) * 100;
        return Math.min(Math.round(rate), 100);
    }, [totalRooms, totalBookings, metrics.averageStayLength]);

    // Scales for custom SVG Monthly Trend Chart
    const chartData = useMemo(() => {
        if (!monthlyTrends || monthlyTrends.length === 0) return [];
        const maxRev = Math.max(...monthlyTrends.map(t => t.revenue), 100);
        const maxBookings = Math.max(...monthlyTrends.map(t => t.bookings), 5);
        return {
            trends: monthlyTrends,
            maxRev,
            maxBookings
        };
    }, [monthlyTrends]);

    // Max room performance revenue for horizontal bar scale
    const maxRoomRevenue = useMemo(() => {
        if (!roomPerformance || roomPerformance.length === 0) return 1;
        return Math.max(...roomPerformance.map(r => r.revenue), 1);
    }, [roomPerformance]);

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* TOP METRICS CARDS */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <div className="border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
                    <div className="mb-3 sm:mb-5 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-lg bg-mint-light text-mint-dark">
                        <Award className="text-emerald-700" size={18} />
                    </div>
                    <p className="text-[10px] sm:text-xs font-bold uppercase text-slate-500">Average Daily Rate (ADR)</p>
                    <p className="mt-1 sm:mt-2 text-xl sm:text-3xl font-semibold text-slate-950">${metrics.averageDailyRate || 0}</p>
                </div>
                <div className="border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
                    <div className="mb-3 sm:mb-5 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-lg bg-sky-light text-sky-dark">
                        <Moon className="text-sky-700" size={18} />
                    </div>
                    <p className="text-[10px] sm:text-xs font-bold uppercase text-slate-500">Avg. Length of Stay</p>
                    <p className="mt-1 sm:mt-2 text-xl sm:text-3xl font-semibold text-slate-950">{metrics.averageStayLength || 0} nights</p>
                </div>
                <div className="border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
                    <div className="mb-3 sm:mb-5 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-lg bg-blush-light text-blush-dark">
                        <ShieldAlert className="text-red-700" size={18} />
                    </div>
                    <p className="text-[10px] sm:text-xs font-bold uppercase text-slate-500">Cancellation Rate</p>
                    <p className="mt-1 sm:mt-2 text-xl sm:text-3xl font-semibold text-slate-950">{metrics.cancellationRate || 0}%</p>
                </div>
                <div className="border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
                    <div className="mb-3 sm:mb-5 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-lg bg-teal-light text-teal-dark">
                        <DollarSign className="text-teal-700" size={18} />
                    </div>
                    <p className="text-[10px] sm:text-xs font-bold uppercase text-slate-500">Occupancy Estimate</p>
                    <p className="mt-1 sm:mt-2 text-xl sm:text-3xl font-semibold text-slate-950">{occupancyRate}%</p>
                </div>
            </div>

            {/* CHART GRID */}
            <div className="grid gap-8 lg:grid-cols-3">
                
                {/* 6-MONTH REVENUE & BOOKING TREND (SVG CHART) */}
                <Panel title="Revenue & Bookings Trend" subtitle="Monthly Completed Revenue vs Reservation Volume" className="lg:col-span-2">
                    {chartData.trends && chartData.trends.length > 0 ? (
                        <div className="relative pt-4">
                            {/* Legend */}
                            <div className="mb-4 flex items-center justify-end gap-6 text-xs font-bold uppercase text-slate-500">
                                <div className="flex items-center gap-2">
                                    <span className="inline-block h-3.5 w-3.5 rounded bg-[#cfe8e3]" />
                                    <span>Revenue ($)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-block h-1 w-5 bg-[#1b6b5f]" />
                                    <span>Bookings</span>
                                </div>
                            </div>

                            {/* SVG Chart */}
                            <svg viewBox="0 0 600 300" className="w-full overflow-visible">
                                {/* Grid lines */}
                                <line x1="50" y1="50" x2="550" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                                <line x1="50" y1="110" x2="550" y2="110" stroke="#f1f5f9" strokeWidth="1" />
                                <line x1="50" y1="170" x2="550" y2="170" stroke="#f1f5f9" strokeWidth="1" />
                                <line x1="50" y1="230" x2="550" y2="230" stroke="#f1f5f9" strokeWidth="1" />

                                {/* Draw bars (Revenue) */}
                                {chartData.trends.map((t, idx) => {
                                    const x = 75 + idx * 80;
                                    const barHeight = chartData.maxRev > 0 ? (t.revenue / chartData.maxRev) * 180 : 0;
                                    const y = 230 - barHeight;
                                    return (
                                        <g key={`bar-${idx}`} className="group transition-all duration-300">
                                            <rect
                                                x={x}
                                                y={y}
                                                width="35"
                                                height={barHeight}
                                                fill="#cfe8e3"
                                                rx="4"
                                                className="hover:fill-[#9dcac1] cursor-pointer transition-colors"
                                            />
                                            {/* Tooltip */}
                                            <text
                                                x={x + 17.5}
                                                y={y - 8}
                                                textAnchor="middle"
                                                className="hidden group-hover:block text-[11px] font-bold fill-[#1b6b5f]"
                                            >
                                                ${t.revenue}
                                            </text>
                                        </g>
                                    );
                                })}

                                {/* Draw line path (Bookings) */}
                                {(() => {
                                    const points = chartData.trends.map((t, idx) => {
                                        const x = 92.5 + idx * 80;
                                        const y = chartData.maxBookings > 0 ? 230 - (t.bookings / chartData.maxBookings) * 180 : 230;
                                        return { x, y };
                                    });

                                    const d = points.reduce((acc, p, idx) => {
                                        return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                                    }, '');

                                    return (
                                        <g>
                                            <path
                                                d={d}
                                                fill="none"
                                                stroke="#1b6b5f"
                                                strokeWidth="3.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                            {points.map((p, idx) => (
                                                <g key={`dot-${idx}`} className="group">
                                                    <circle
                                                        cx={p.x}
                                                        cy={p.y}
                                                        r="5.5"
                                                        fill="#ffffff"
                                                        stroke="#1b6b5f"
                                                        strokeWidth="3"
                                                        className="cursor-pointer transition-transform hover:scale-125"
                                                    />
                                                    {/* Dot Tooltip */}
                                                    <text
                                                        x={p.x}
                                                        y={p.y - 12}
                                                        textAnchor="middle"
                                                        className="hidden group-hover:block text-[11px] font-bold fill-slate-800"
                                                    >
                                                        {chartData.trends[idx].bookings} bookings
                                                    </text>
                                                </g>
                                            ))}
                                        </g>
                                    );
                                })()}

                                {/* Axes & Labels */}
                                <line x1="50" y1="230" x2="550" y2="230" stroke="#cbd5e1" strokeWidth="1.5" />
                                {chartData.trends.map((t, idx) => (
                                    <text
                                        key={`label-${idx}`}
                                        x={92.5 + idx * 80}
                                        y="255"
                                        textAnchor="middle"
                                        className="text-xs font-bold text-slate-500 fill-slate-500 uppercase tracking-widest"
                                    >
                                        {t.label}
                                    </text>
                                ))}
                            </svg>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 text-center py-12">No trend data available.</p>
                    )}
                </Panel>

                {/* RESERVATION STATUS BREAKDOWN */}
                <Panel title="Reservation Status" subtitle="Breakdown of booking lifecycle statuses.">
                    <div className="space-y-6 pt-4">
                        {Object.entries(bookingsByStatus).map(([status, count]) => {
                            const percentage = totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0;
                            const statusColor = {
                                Completed: 'bg-[#e4fff6] text-[#1b6b5f] border-emerald-200',
                                Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                                Cancelled: 'bg-red-50 text-red-700 border-red-200',
                                Refunded: 'bg-orange-50 text-orange-700 border-orange-200'
                            }[status] || 'bg-slate-50 text-slate-600 border-slate-200';

                            const barFillColor = {
                                Completed: 'bg-emerald-600',
                                Pending: 'bg-yellow-500',
                                Cancelled: 'bg-red-500',
                                Refunded: 'bg-orange-500'
                            }[status] || 'bg-slate-400';

                            return (
                                <div key={status} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className={`rounded-lg border px-2.5 py-0.5 text-xs font-bold uppercase ${statusColor}`}>
                                            {status}
                                        </span>
                                        <span className="font-semibold text-slate-900">{count} stays ({percentage}%)</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${barFillColor}`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Panel>
            </div>

            {/* LOWER GRID: ROOM PERFORMANCE & OVERVIEW LOG */}
            <div className="grid gap-8 lg:grid-cols-2">
                {/* TOP PERFORMING ROOMS */}
                <Panel title="Room Category Performance" subtitle="Most booked rooms and generated revenue.">
                    <div className="space-y-6 pt-4">
                        {roomPerformance && roomPerformance.length > 0 ? (
                            roomPerformance.map((room, idx) => {
                                const fillPercentage = maxRoomRevenue > 0 ? (room.revenue / maxRoomRevenue) * 100 : 0;
                                return (
                                    <div key={`room-perf-${idx}`} className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-semibold text-slate-800">{room.name}</span>
                                            <span className="font-bold text-slate-950">
                                                {room.bookings} Bookings <span className="mx-1.5 text-slate-300">•</span> ${room.revenue}
                                            </span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full bg-[#1b6b5f] transition-all duration-500"
                                                style={{ width: `${fillPercentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-sm text-slate-500">No rooms transactions logged yet.</p>
                        )}
                    </div>
                </Panel>

                {/* HISTORICAL SUMMARY TABLE */}
                <Panel title="Analytical Summaries" subtitle="Average metrics and key data overview.">
                    <div className="pt-2">
                        <DataTable
                            headers={['KPI Metric', 'Calculated Value', 'Target Benchmark']}
                            rows={[
                                ['Average Daily Rate (ADR)', `$${metrics.averageDailyRate}`, '$150/night'],
                                ['Average Length of Stay (LoS)', `${metrics.averageStayLength} nights`, '3.0 nights'],
                                ['Cancellation Rate', `${metrics.cancellationRate}%`, '<15.0%'],
                                ['Occupancy Rate Estimate', `${occupancyRate}%`, '>60.0%'],
                                ['Total Verified Accounts', `${stats.totalUsers} guests`, 'N/A']
                            ]}
                        />
                    </div>
                </Panel>
            </div>
        </div>
    );
};

export default AnalyticsTab;
