import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import API from '../api';
import { invalidateCache } from '../utils/cache';
import Panel from '../components/Panel';
import FormField from '../components/FormField';
import ImageManager from '../components/ImageManager';
import RoomInventoryCard from '../components/RoomInventoryCard';

const emptyRoomForm = {
    name: '',
    type: '',
    description: '',
    pricePerNight: 0,
    maxGuests: 2,
    extraGuestLimit: 0,
    extraGuestCharge: 0,
    maxChildren: 2,
    bedSize: 'King',
    roomSize: 400,
    totalRooms: 1,
    amenities: [],
    customAmenities: '',
    images: [],
    categorizedImages: {
        morningLight: [],
        roomDetails: [],
        outdoorCalm: []
    },
    availability: true
};

const normalizeAmenities = (value) => {
    if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean);
    return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
};

const RoomInventoryTab = ({ rooms, roomTypes, amenities, refetch, authConfig }) => {
    const [roomForm, setRoomForm] = useState({
        ...emptyRoomForm,
        type: roomTypes[0]?.name || ''
    });
    const [editingRoom, setEditingRoom] = useState(null);
    const [uploadingMain, setUploadingMain] = useState(false);
    const [uploadingMorningLight, setUploadingMorningLight] = useState(false);
    const [uploadingRoomDetails, setUploadingRoomDetails] = useState(false);
    const [uploadingOutdoorCalm, setUploadingOutdoorCalm] = useState(false);

    const resetRoomForm = () => {
        setEditingRoom(null);
        setRoomForm({ ...emptyRoomForm, type: roomTypes[0]?.name || '' });
    };

    const handleRoomSubmit = async (e) => {
        e.preventDefault();
        const customAmenities = normalizeAmenities(roomForm.customAmenities);
        const payload = {
            name: roomForm.name,
            type: roomForm.type,
            description: roomForm.description,
            pricePerNight: Number(roomForm.pricePerNight),
            maxGuests: Number(roomForm.maxGuests),
            extraGuestLimit: Math.max(0, Number(roomForm.extraGuestLimit) || 0),
            extraGuestCharge: Math.max(0, Number(roomForm.extraGuestCharge) || 0),
            maxChildren: Math.max(0, Number(roomForm.maxChildren) || 0),
            bedSize: roomForm.bedSize,
            roomSize: Number(roomForm.roomSize),
            totalRooms: Math.max(1, Number(roomForm.totalRooms) || 1),
            amenities: Array.from(new Set([...(roomForm.amenities || []), ...customAmenities])),
            images: roomForm.images,
            categorizedImages: roomForm.categorizedImages,
            availability: Boolean(roomForm.availability),
            allowExtraGuests: true
        };

        try {
            if (editingRoom) {
                await API.put(`/rooms/${editingRoom._id}`, payload, authConfig);
                invalidateCache('/rooms');
                toast.success('Room updated');
            } else {
                await API.post('/rooms', payload, authConfig);
                invalidateCache('/rooms');
                toast.success('Room created');
            }
            resetRoomForm();
            refetch();
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Room action failed';
            toast.error(errorMsg);
        }
    };

    const editRoom = (room) => {
        setEditingRoom(room);
        setRoomForm({
            name: room.name || '',
            type: room.type || roomTypes[0]?.name || '',
            description: room.description || '',
            pricePerNight: room.pricePerNight || 0,
            maxGuests: room.maxGuests || 2,
            extraGuestLimit: Math.max(0, Number(room.extraGuestLimit) || 0),
            extraGuestCharge: Math.max(0, Number(room.extraGuestCharge) || 0),
            maxChildren: Math.max(0, Number(room.maxChildren) || 2),
            bedSize: room.bedSize || 'King',
            roomSize: room.roomSize || 400,
            totalRooms: room.totalRooms || 1,
            amenities: room.amenities || [],
            customAmenities: '',
            images: room.images || [],
            categorizedImages: room.categorizedImages || { morningLight: [], roomDetails: [], outdoorCalm: [] },
            availability: room.availability !== false
        });
    };

    const deleteRoom = async (id) => {
        if (!window.confirm('Delete this room?')) return;
        try {
            await API.delete(`/rooms/${id}`, authConfig);
            invalidateCache('/rooms');
            toast.success('Room deleted');
            refetch();
        } catch (error) {
            toast.error('Delete failed');
        }
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const formData = new FormData();
        files.forEach((file) => formData.append('images', file));

        setUploadingMain(true);
        try {
            const { data } = await API.post('/upload', formData, {
                headers: {
                    ...authConfig.headers,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setRoomForm((prev) => ({ ...prev, images: [...prev.images, ...data.urls] }));
            toast.success('Images uploaded');
        } catch (error) {
            toast.error('Image upload failed');
        } finally {
            setUploadingMain(false);
        }
    };

    const handleCategorizedUpload = async (e, category) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const formData = new FormData();
        files.forEach((file) => formData.append('images', file));

        const setUploadingState = {
            morningLight: setUploadingMorningLight,
            roomDetails: setUploadingRoomDetails,
            outdoorCalm: setUploadingOutdoorCalm
        }[category];

        if (setUploadingState) {
            setUploadingState(true);
        }

        try {
            const { data } = await API.post('/upload', formData, {
                headers: {
                    ...authConfig.headers,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setRoomForm((prev) => ({
                ...prev,
                categorizedImages: {
                    ...prev.categorizedImages,
                    [category]: [...prev.categorizedImages[category], ...data.urls]
                }
            }));
            toast.success(`${category} images uploaded`);
        } catch (error) {
            toast.error('Image upload failed');
        } finally {
            if (setUploadingState) {
                setUploadingState(false);
            }
        }
    };

    const handleCategorizedRemove = (category, index) => {
        setRoomForm((prev) => ({
            ...prev,
            categorizedImages: {
                ...prev.categorizedImages,
                [category]: prev.categorizedImages[category].filter((_, i) => i !== index)
            }
        }));
    };

    const toggleAmenity = (amenity) => {
        setRoomForm((prev) => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter((item) => item !== amenity)
                : [...prev.amenities, amenity]
        }));
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="space-y-6">
                <Panel title={editingRoom ? 'Edit Room' : 'Create Room'} subtitle="Create sellable room listings and attach inventory units.">
                    <form onSubmit={handleRoomSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            <div className="col-span-2 sm:col-span-1">
                                <FormField label="Room name" value={roomForm.name} onChange={(value) => setRoomForm({ ...roomForm, name: value })} />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-[10px] sm:text-xs font-bold uppercase text-slate-500">Category</label>
                                <select
                                    value={roomForm.type}
                                    onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm outline-none focus:border-[#1b6b5f]"
                                    required
                                >
                                    <option value="">Select category</option>
                                    {roomTypes.map((type) => (
                                        <option key={type._id} value={type.name}>{type.name}</option>
                                    ))}
                                </select>
                            </div>

                            <FormField label="Price/Night" type="number" value={roomForm.pricePerNight} onChange={(value) => setRoomForm({ ...roomForm, pricePerNight: value })} />
                            <FormField label="Base Guests" type="number" value={roomForm.maxGuests} onChange={(value) => setRoomForm({ ...roomForm, maxGuests: value })} />
                            <FormField label="Extra Guest Limit" type="number" value={roomForm.extraGuestLimit} onChange={(value) => setRoomForm({ ...roomForm, extraGuestLimit: value })} />
                            <FormField label="Extra Guest Price (₹)" type="number" value={roomForm.extraGuestCharge} onChange={(value) => setRoomForm({ ...roomForm, extraGuestCharge: value })} />
                            <FormField label="Max Children (Free)" type="number" value={roomForm.maxChildren} onChange={(value) => setRoomForm({ ...roomForm, maxChildren: value })} />
                            <FormField label="Room units" type="number" value={roomForm.totalRooms} onChange={(value) => setRoomForm({ ...roomForm, totalRooms: value })} />

                            <div>
                                <label className="mb-1.5 block text-[10px] sm:text-xs font-bold uppercase text-slate-500">Bed Size</label>
                                <select
                                    value={roomForm.bedSize}
                                    onChange={(e) => setRoomForm({ ...roomForm, bedSize: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm outline-none focus:border-[#1b6b5f]"
                                >
                                    <option value="Single">Single</option>
                                    <option value="Double">Double</option>
                                    <option value="Queen">Queen</option>
                                    <option value="King">King</option>
                                    <option value="Twin">Twin</option>
                                    <option value="California King">California King</option>
                                </select>
                            </div>
                            <FormField label="Room Size (sq ft)" type="number" value={roomForm.roomSize} onChange={(value) => setRoomForm({ ...roomForm, roomSize: value })} />
                        </div>
                        
                        <div>
                            <label className="mb-1.5 block text-[10px] sm:text-xs font-bold uppercase text-slate-500">Description</label>
                            <textarea
                                value={roomForm.description}
                                onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                                className="h-20 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm outline-none focus:border-[#1b6b5f]"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="mb-1.5 block text-[10px] sm:text-xs font-bold uppercase text-slate-500">Resort amenities for this room</label>
                            <div className="flex flex-wrap gap-1.5">
                                {amenities.length ? amenities.map((amenity) => (
                                    <button
                                        key={amenity._id}
                                        type="button"
                                        onClick={() => toggleAmenity(amenity.name)}
                                        className={`rounded-lg border px-2.5 py-1.5 text-[10px] sm:text-xs font-semibold transition ${roomForm.amenities.includes(amenity.name)
                                            ? 'border-[#1b6b5f] bg-[#e4fff6] text-[#1b6b5f]'
                                            : 'border-slate-200 bg-white text-slate-600'
                                            }`}
                                    >
                                        {amenity.name}
                                    </button>
                                )) : (
                                    <p className="text-xs text-slate-500">Add resort amenities in Room Management, then select them here.</p>
                                )}
                            </div>
                        </div>

                        <FormField label="Extra amenities" value={roomForm.customAmenities} onChange={(value) => setRoomForm({ ...roomForm, customAmenities: value })} placeholder="Fireplace, Butler service" required={false} />
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-center rounded-lg border border-slate-200 bg-[#e4fff6] px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-[#1b6b5f]">
                                Additional guests are enabled.
                            </div>
                            <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-slate-700">
                                Available for booking
                                <input
                                    type="checkbox"
                                    checked={roomForm.availability}
                                    onChange={(e) => setRoomForm({ ...roomForm, availability: e.target.checked })}
                                    className="h-4 w-4 sm:h-5 sm:w-5 rounded border-slate-300 text-[#1b6b5f] accent-[#1b6b5f]"
                                />
                            </label>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
                            <ImageManager label="Main Room Images" images={roomForm.images} uploading={uploadingMain} onUpload={handleImageUpload} onRemove={(idx) => setRoomForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))} />
                            
                            <hr className="border-slate-100" />
                            
                            <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#1b6b5f]">Categorized Media Showcase</h4>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                                <ImageManager label="Morning Light (e.g. Balcony/Views)" images={roomForm.categorizedImages.morningLight} uploading={uploadingMorningLight} onUpload={(e) => handleCategorizedUpload(e, 'morningLight')} onRemove={(idx) => handleCategorizedRemove('morningLight', idx)} />
                                <ImageManager label="Room Details (e.g. Beds, Bathrooms)" images={roomForm.categorizedImages.roomDetails} uploading={uploadingRoomDetails} onUpload={(e) => handleCategorizedUpload(e, 'roomDetails')} onRemove={(idx) => handleCategorizedRemove('roomDetails', idx)} />
                                <ImageManager label="Outdoor Calm (e.g. Garden/Pool side)" images={roomForm.categorizedImages.outdoorCalm} uploading={uploadingOutdoorCalm} onUpload={(e) => handleCategorizedUpload(e, 'outdoorCalm')} onRemove={(idx) => handleCategorizedRemove('outdoorCalm', idx)} />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                            {editingRoom && (
                                <button
                                    type="button"
                                    onClick={resetRoomForm}
                                    className="rounded-lg border border-slate-300 px-4 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Cancel Edit
                                </button>
                            )}
                            <button
                                type="submit"
                                className="rounded-lg bg-[#1b6b5f] px-4 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#15564d] transition"
                            >
                                {editingRoom ? 'Save Changes' : 'Create Listing'}
                            </button>
                        </div>
                    </form>
                </Panel>
            </div>

            <Panel title="Active Listings" subtitle="Verify and manage room rates, occupancy rules, and availability.">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {rooms.map((room) => (
                        <RoomInventoryCard
                            key={room._id}
                            room={room}
                            onEdit={() => editRoom(room)}
                            onDelete={() => deleteRoom(room._id)}
                        />
                    ))}
                </div>
            </Panel>
        </div>
    );
};

export default RoomInventoryTab;
