import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import API from '../api';
import { invalidateCache } from '../utils/cache';
import Panel from '../components/Panel';
import FormField from '../components/FormField';

const SettingsTab = ({ initialSettings, refetch, authConfig }) => {
    const [resortSettings, setResortSettings] = useState({
        gstPercent: 0,
        serviceCharge: 0,
        cleaningFee: 0,
        childPrice: 0,
        weekendMarkupPercent: 0,
        minStayNights: 1,
        maxStayNights: 30,
        earlyCheckInFee: 0,
        lateCheckOutFee: 0,
        advancePercentage: 100,
        allowPartialPayment: false,
        payAtProperty: true,
        cancellationPolicy: '',
        refundRules: '',
        bookingCutoffHours: 0,
        childAgeLimit: 12
    });
    const [savingSettings, setSavingSettings] = useState(false);

    useEffect(() => {
        if (initialSettings) {
            setResortSettings(initialSettings);
        }
    }, [initialSettings]);

    const updateSettings = async (e) => {
        e.preventDefault();
        setSavingSettings(true);
        try {
            const settingsPayload = {
                gstPercent: Number(resortSettings.gstPercent),
                serviceCharge: Number(resortSettings.serviceCharge),
                cleaningFee: Number(resortSettings.cleaningFee),
                childPrice: Number(resortSettings.childPrice),
                weekendMarkupPercent: Number(resortSettings.weekendMarkupPercent),
                minStayNights: Number(resortSettings.minStayNights),
                maxStayNights: Number(resortSettings.maxStayNights),
                earlyCheckInFee: Number(resortSettings.earlyCheckInFee),
                lateCheckOutFee: Number(resortSettings.lateCheckOutFee),
                advancePercentage: Number(resortSettings.advancePercentage),
                allowPartialPayment: Boolean(resortSettings.allowPartialPayment),
                payAtProperty: Boolean(resortSettings.payAtProperty),
                cancellationPolicy: resortSettings.cancellationPolicy || '',
                refundRules: resortSettings.refundRules || '',
                bookingCutoffHours: Number(resortSettings.bookingCutoffHours),
                childAgeLimit: Number(resortSettings.childAgeLimit)
            };
            await API.put('/settings', settingsPayload, authConfig);
            invalidateCache('/settings');
            toast.success('Settings updated successfully');
            refetch();
        } catch (error) {
            toast.error('Failed to update settings');
        } finally {
            setSavingSettings(false);
        }
    };

    return (
        <form onSubmit={updateSettings} className="space-y-8">
            <Panel title="Pricing & Charges" subtitle="Configure taxes and fixed fees applied to bookings.">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <FormField label="GST (%)" type="number" value={resortSettings.gstPercent} onChange={(v) => setResortSettings({ ...resortSettings, gstPercent: Number(v) })} placeholder="e.g. 18" />
                    <FormField label="Service Charge (₹)" type="number" value={resortSettings.serviceCharge} onChange={(v) => setResortSettings({ ...resortSettings, serviceCharge: Number(v) })} />
                    <FormField label="Cleaning Fee (₹)" type="number" value={resortSettings.cleaningFee} onChange={(v) => setResortSettings({ ...resortSettings, cleaningFee: Number(v) })} />
                    <FormField label="Child Pricing (₹)" type="number" value={resortSettings.childPrice} onChange={(v) => setResortSettings({ ...resortSettings, childPrice: Number(v) })} />
                </div>
            </Panel>

            <Panel title="Pricing Rules & Time-Based" subtitle="Manage dynamic pricing restrictions and time-based penalties.">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <FormField label="Weekend Markup (%)" type="number" value={resortSettings.weekendMarkupPercent} onChange={(v) => setResortSettings({ ...resortSettings, weekendMarkupPercent: Number(v) })} />
                    <FormField label="Minimum Stay (Nights)" type="number" value={resortSettings.minStayNights} onChange={(v) => setResortSettings({ ...resortSettings, minStayNights: Number(v) })} />
                    <FormField label="Maximum Stay (Nights)" type="number" value={resortSettings.maxStayNights} onChange={(v) => setResortSettings({ ...resortSettings, maxStayNights: Number(v) })} />
                    <FormField label="Early Check-in Fee (₹)" type="number" value={resortSettings.earlyCheckInFee} onChange={(v) => setResortSettings({ ...resortSettings, earlyCheckInFee: Number(v) })} />
                    <FormField label="Late Check-out Fee (₹)" type="number" value={resortSettings.lateCheckOutFee} onChange={(v) => setResortSettings({ ...resortSettings, lateCheckOutFee: Number(v) })} />
                </div>
            </Panel>

            <Panel title="Payment Settings" subtitle="Configure how guests pay for reservations.">
                <div className="grid gap-6 md:grid-cols-3">
                    <FormField label="Advance Payment Required (%)" type="number" value={resortSettings.advancePercentage} onChange={(v) => setResortSettings({ ...resortSettings, advancePercentage: Number(v) })} />
                    <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-slate-700">
                        Allow Partial Payment
                        <input type="checkbox" checked={resortSettings.allowPartialPayment} onChange={(e) => setResortSettings({ ...resortSettings, allowPartialPayment: e.target.checked })} className="h-5 w-5" />
                    </label>
                    <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-slate-700">
                        Allow Pay at Property
                        <input type="checkbox" checked={resortSettings.payAtProperty} onChange={(e) => setResortSettings({ ...resortSettings, payAtProperty: e.target.checked })} className="h-5 w-5" />
                    </label>
                </div>
            </Panel>

            <Panel title="Booking Policies" subtitle="Set cancellation and refund rules visible to guests.">
                <div className="grid gap-6 md:grid-cols-2">
                    <FormField label="Booking Cutoff Hours" type="number" value={resortSettings.bookingCutoffHours} onChange={(v) => setResortSettings({ ...resortSettings, bookingCutoffHours: Number(v) })} />
                    <FormField label="Child Age Limit" type="number" value={resortSettings.childAgeLimit} onChange={(v) => setResortSettings({ ...resortSettings, childAgeLimit: Number(v) })} />
                    <div className="md:col-span-2">
                        <label className="mb-1.5 block text-[10px] sm:text-xs font-bold uppercase text-slate-500">Cancellation Policy</label>
                        <textarea value={resortSettings.cancellationPolicy} onChange={(e) => setResortSettings({ ...resortSettings, cancellationPolicy: e.target.value })} className="h-24 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm outline-none focus:border-[#1b6b5f]" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="mb-1.5 block text-[10px] sm:text-xs font-bold uppercase text-slate-500">Refund Rules</label>
                        <textarea value={resortSettings.refundRules} onChange={(e) => setResortSettings({ ...resortSettings, refundRules: e.target.value })} className="h-24 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm outline-none focus:border-[#1b6b5f]" />
                    </div>
                </div>
            </Panel>

            <div className="flex justify-end pt-6 border-t border-slate-200 sticky bottom-0 bg-[#f7faf8] pb-4">
                <button
                    type="submit"
                    disabled={savingSettings}
                    className="rounded-lg bg-[#1b6b5f] px-5 py-2.5 sm:px-8 sm:py-3 text-xs sm:text-sm font-bold uppercase text-white hover:bg-[#15564d] transition disabled:opacity-50 min-w-[150px] sm:min-w-[200px]"
                >
                    {savingSettings ? <Loader2 className="animate-spin inline-block mr-2" size={16} /> : 'Save All Settings'}
                </button>
            </div>
        </form>
    );
};

export default SettingsTab;
