import React, { useState } from 'react';
import { toast } from 'react-toastify';
import API from '../api';
import { invalidateCache } from '../utils/cache';
import Panel from '../components/Panel';
import FormField from '../components/FormField';
import CategoryCard from '../components/CategoryCard';
import AmenityCard from '../components/AmenityCard';

const emptyCategoryForm = {
    name: '',
    description: ''
};

const emptyAmenityForm = {
    name: '',
    description: '',
    icon: ''
};

const RoomManagementTab = ({ roomTypes, amenities, refetch, authConfig }) => {
    const [typeForm, setTypeForm] = useState(emptyCategoryForm);
    const [editingType, setEditingType] = useState(null);

    const [amenityForm, setAmenityForm] = useState(emptyAmenityForm);
    const [editingAmenity, setEditingAmenity] = useState(null);

    const resetTypeForm = () => {
        setEditingType(null);
        setTypeForm(emptyCategoryForm);
    };

    const resetAmenityForm = () => {
        setEditingAmenity(null);
        setAmenityForm(emptyAmenityForm);
    };

    const handleRoomTypeSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            name: typeForm.name,
            description: typeForm.description
        };

        try {
            if (editingType) {
                await API.put(`/room-types/${editingType._id}`, payload, authConfig);
                invalidateCache('/room-types');
                toast.success('Category updated');
            } else {
                await API.post('/room-types', payload, authConfig);
                invalidateCache('/room-types');
                toast.success('Category created');
            }
            resetTypeForm();
            refetch();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Category action failed');
        }
    };

    const handleAmenitySubmit = async (e) => {
        e.preventDefault();
        const payload = {
            name: amenityForm.name,
            description: amenityForm.description,
            icon: amenityForm.icon
        };

        try {
            if (editingAmenity) {
                await API.put(`/amenities/${editingAmenity._id}`, payload, authConfig);
                invalidateCache('/amenities');
                toast.success('Amenity updated');
            } else {
                await API.post('/amenities', payload, authConfig);
                invalidateCache('/amenities');
                toast.success('Amenity created');
            }
            resetAmenityForm();
            refetch();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Amenity action failed');
        }
    };

    const deleteRoomType = async (id) => {
        if (!window.confirm('Delete this category? Rooms using it may be affected.')) return;
        try {
            await API.delete(`/room-types/${id}`, authConfig);
            invalidateCache('/room-types');
            toast.success('Category deleted');
            refetch();
        } catch (error) {
            toast.error('Failed to delete category');
        }
    };

    const deleteAmenity = async (id) => {
        if (!window.confirm('Delete this amenity? Rooms already using it will keep the text until edited.')) return;
        try {
            await API.delete(`/amenities/${id}`, authConfig);
            invalidateCache('/amenities');
            toast.success('Amenity deleted');
            refetch();
        } catch (error) {
            toast.error('Failed to delete amenity');
        }
    };

    return (
        <div className="grid gap-8 lg:grid-cols-2">
            {/* LEFT COLUMN: Categories */}
            <div className="space-y-6">
                <Panel title={editingType ? 'Edit Category' : 'Create Category'} subtitle="Differentiate rooms (e.g. Deluxe, Suite, Villa) for booking packages.">
                    <form onSubmit={handleRoomTypeSubmit} className="space-y-4">
                        <FormField label="Category name" value={typeForm.name} onChange={(v) => setTypeForm({ ...typeForm, name: v })} />
                        <div>
                            <label className="mb-1.5 block text-[10px] sm:text-xs font-bold uppercase text-slate-500">Description</label>
                            <textarea
                                value={typeForm.description}
                                onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                                className="h-20 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm outline-none focus:border-[#1b6b5f]"
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                            {editingType && (
                                <button type="button" onClick={resetTypeForm} className="rounded-lg border border-slate-300 px-4 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
                                    Cancel
                                </button>
                            )}
                            <button type="submit" className="rounded-lg bg-[#1b6b5f] px-4 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#15564d] transition">
                                {editingType ? 'Save Changes' : 'Create Category'}
                            </button>
                        </div>
                    </form>
                </Panel>

                <Panel title="Active Categories">
                    <div className="grid gap-4">
                        {roomTypes.map((type) => (
                            <CategoryCard
                                key={type._id}
                                type={type}
                                onEdit={() => {
                                    setEditingType(type);
                                    setTypeForm({ name: type.name || '', description: type.description || '' });
                                }}
                                onDelete={() => deleteRoomType(type._id)}
                            />
                        ))}
                    </div>
                </Panel>
            </div>

            {/* RIGHT COLUMN: Amenities */}
            <div className="space-y-6">
                <Panel title={editingAmenity ? 'Edit Amenity' : 'Create Amenity'} subtitle="Resort-wide feature options (e.g. WiFi, Pool, Spa) guests can search for.">
                    <form onSubmit={handleAmenitySubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Amenity Name" value={amenityForm.name} onChange={(v) => setAmenityForm({ ...amenityForm, name: v })} />
                            <FormField label="Icon Key (Optional)" value={amenityForm.icon} onChange={(v) => setAmenityForm({ ...amenityForm, icon: v })} placeholder="Wifi, Coffee" required={false} />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-[10px] sm:text-xs font-bold uppercase text-slate-500">Description</label>
                            <textarea
                                value={amenityForm.description}
                                onChange={(e) => setAmenityForm({ ...amenityForm, description: e.target.value })}
                                className="h-20 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm outline-none focus:border-[#1b6b5f]"
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                            {editingAmenity && (
                                <button type="button" onClick={resetAmenityForm} className="rounded-lg border border-slate-300 px-4 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
                                    Cancel
                                </button>
                            )}
                            <button type="submit" className="rounded-lg bg-[#1b6b5f] px-4 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#15564d] transition">
                                {editingAmenity ? 'Save Changes' : 'Create Amenity'}
                            </button>
                        </div>
                    </form>
                </Panel>

                <Panel title="Active Amenities">
                    <div className="grid gap-4">
                        {amenities.map((amenity) => (
                            <AmenityCard
                                key={amenity._id}
                                amenity={amenity}
                                onEdit={() => {
                                    setEditingAmenity(amenity);
                                    setAmenityForm({ name: amenity.name || '', description: amenity.description || '', icon: amenity.icon || '' });
                                }}
                                onDelete={() => deleteAmenity(amenity._id)}
                            />
                        ))}
                    </div>
                </Panel>
            </div>
        </div>
    );
};

export default RoomManagementTab;
