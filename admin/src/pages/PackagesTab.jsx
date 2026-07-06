import React, { useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import API from '../api';
import { invalidateCache } from '../utils/cache';
import Panel from '../components/Panel';
import FormField from '../components/FormField';

const emptyPackageForm = {
    name: '',
    description: '',
    price: 0,
    duration: '',
    image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1000&q=80',
    highlights: [],
    amenities: [],
    capacity: 1,
    availability: true,
    discount: 0
};

const PackagesTab = ({ packages, refetch, authConfig }) => {
    const [editingPackage, setEditingPackage] = useState(null);
    const [packageForm, setPackageForm] = useState(emptyPackageForm);
    const [newHighlight, setNewHighlight] = useState('');
    const [newAmenity, setNewAmenity] = useState('');

    const handleAddHighlight = (e) => {
        e.preventDefault();
        if (!newHighlight.trim()) return;
        if (packageForm.highlights?.includes(newHighlight.trim())) {
            return toast.warn('Highlight already exists');
        }
        setPackageForm({
            ...packageForm,
            highlights: [...(packageForm.highlights || []), newHighlight.trim()]
        });
        setNewHighlight('');
    };

    const handleRemoveHighlight = (indexToRemove) => {
        setPackageForm({
            ...packageForm,
            highlights: (packageForm.highlights || []).filter((_, idx) => idx !== indexToRemove)
        });
    };

    const handleAddAmenity = (e) => {
        e.preventDefault();
        if (!newAmenity.trim()) return;
        if (packageForm.amenities?.includes(newAmenity.trim())) {
            return toast.warn('Amenity already exists');
        }
        setPackageForm({
            ...packageForm,
            amenities: [...(packageForm.amenities || []), newAmenity.trim()]
        });
        setNewAmenity('');
    };

    const handleRemoveAmenity = (indexToRemove) => {
        setPackageForm({
            ...packageForm,
            amenities: (packageForm.amenities || []).filter((_, idx) => idx !== indexToRemove)
        });
    };

    const handlePackageSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPackage) {
                await API.put(`/packages/${editingPackage._id}`, packageForm, authConfig);
                invalidateCache('/packages');
                toast.success('Package updated successfully');
            } else {
                await API.post('/packages', packageForm, authConfig);
                invalidateCache('/packages');
                toast.success('Package created successfully');
            }
            refetch();
            setEditingPackage(null);
            setPackageForm({ ...emptyPackageForm });
        } catch (error) {
            toast.error('Failed to save package');
        }
    };

    const handleDeletePackage = async (packageId) => {
        if (!window.confirm('Are you sure you want to delete this package?')) return;
        try {
            await API.delete(`/packages/${packageId}`, authConfig);
            invalidateCache('/packages');
            toast.success('Package deleted successfully');
            refetch();
        } catch (error) {
            toast.error('Failed to delete package');
        }
    };

    return (
        <div className="flex flex-col gap-8">
            <Panel title={editingPackage ? 'Edit Package' : 'Create New Package'} subtitle="Add and manage resort packages.">
                <form onSubmit={handlePackageSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="col-span-2 sm:col-span-2">
                            <FormField
                                label="Package Name"
                                value={packageForm.name}
                                onChange={(value) => setPackageForm({ ...packageForm, name: value })}
                                required
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <FormField
                                label="Price (₹)"
                                type="number"
                                value={packageForm.price}
                                onChange={(value) => setPackageForm({ ...packageForm, price: Number(value) })}
                                required
                            />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <FormField
                                label="Duration"
                                placeholder="e.g. 3 days, 1 week"
                                value={packageForm.duration}
                                onChange={(value) => setPackageForm({ ...packageForm, duration: value })}
                                required
                            />
                        </div>
                        <div className="col-span-1 sm:col-span-1">
                            <FormField
                                label="Capacity (Guests)"
                                type="number"
                                value={packageForm.capacity}
                                onChange={(value) => setPackageForm({ ...packageForm, capacity: Number(value) })}
                            />
                        </div>
                        <div className="col-span-1 sm:col-span-1">
                            <FormField
                                label="Discount (%)"
                                type="number"
                                value={packageForm.discount}
                                onChange={(value) => setPackageForm({ ...packageForm, discount: Number(value) })}
                                min="0"
                                max="100"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-[10px] sm:text-xs font-bold uppercase text-slate-500">Description</label>
                        <textarea
                            value={packageForm.description}
                            onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm outline-none focus:border-[#1b6b5f]"
                            rows="3"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-[10px] sm:text-xs font-bold uppercase text-slate-500">Image URL</label>
                        <input
                            type="url"
                            value={packageForm.image}
                            onChange={(e) => setPackageForm({ ...packageForm, image: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm outline-none focus:border-[#1b6b5f]"
                        />
                    </div>

                    {/* Highlights and Amenities dynamic list editors */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        {/* Highlights Editor */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <label className="mb-1.5 block text-[10px] sm:text-xs font-bold uppercase text-slate-700">Package Highlights</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={newHighlight}
                                    onChange={(e) => setNewHighlight(e.target.value)}
                                    placeholder="e.g. Guided Nature Trek"
                                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs outline-none focus:border-[#1b6b5f]"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddHighlight}
                                    className="bg-[#1b6b5f] hover:bg-[#15564d] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                                >
                                    + Add
                                </button>
                            </div>
                            
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                                {(packageForm.highlights || []).length === 0 ? (
                                    <span className="text-[10px] text-slate-400 italic">No highlights added.</span>
                                ) : (
                                    (packageForm.highlights || []).map((hl, idx) => (
                                        <span key={idx} className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-[#134941] text-[10px] font-medium px-2 py-0.5 rounded">
                                            {hl}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveHighlight(idx)}
                                                className="text-[#134941] hover:text-red-500 font-bold ml-1"
                                            >
                                                ✕
                                            </button>
                                        </span>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Amenities Editor */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <label className="mb-1.5 block text-[10px] sm:text-xs font-bold uppercase text-slate-700">Resort Amenities</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={newAmenity}
                                    onChange={(e) => setNewAmenity(e.target.value)}
                                    placeholder="e.g. Complimentary Spa"
                                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs outline-none focus:border-[#1b6b5f]"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddAmenity}
                                    className="bg-[#1b6b5f] hover:bg-[#15564d] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                                >
                                    + Add
                                </button>
                            </div>
                            
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                                {(packageForm.amenities || []).length === 0 ? (
                                    <span className="text-[10px] text-slate-400 italic">No amenities added.</span>
                                ) : (
                                    (packageForm.amenities || []).map((am, idx) => (
                                        <span key={idx} className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded">
                                            {am}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveAmenity(idx)}
                                                className="text-slate-500 hover:text-red-500 font-bold ml-1"
                                            >
                                                ✕
                                            </button>
                                        </span>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            className="rounded-lg bg-[#1b6b5f] px-4 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#15564d] transition"
                        >
                            {editingPackage ? 'Update Package' : 'Create Package'}
                        </button>
                        {editingPackage && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingPackage(null);
                                    setPackageForm({ ...emptyPackageForm });
                                }}
                                className="rounded-lg border border-slate-300 px-4 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </Panel>

            <Panel title="All Packages" subtitle="View, edit, and manage packages.">
                <div className="space-y-4">
                    {packages.length === 0 ? (
                        <p className="text-slate-500">No packages created yet.</p>
                    ) : (
                        packages.map((pkg) => (
                            <div key={pkg._id} className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <div>
                                    <h4 className="font-semibold text-slate-900">{pkg.name}</h4>
                                    <p className="text-sm text-slate-600">₹{pkg.price} - {pkg.duration}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingPackage(pkg);
                                            setPackageForm({
                                                ...emptyPackageForm,
                                                ...pkg,
                                                highlights: pkg.highlights || [],
                                                amenities: pkg.amenities || []
                                            });
                                        }}
                                        className="rounded-lg bg-[#1b6b5f] text-white p-2 hover:bg-[#15564d] transition"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeletePackage(pkg._id)}
                                        className="rounded-lg bg-red-500 text-white p-2 hover:bg-red-600 transition"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Panel>
        </div>
    );
};

export default PackagesTab;
