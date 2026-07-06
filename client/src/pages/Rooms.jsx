import { Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { RoomsGridSkeleton } from '../components/LoadingSkeleton';
import RoomCard from '../components/RoomCard';
import { cachedGet } from '../utils/cache';

const Rooms = () => {
    const [rooms, setRooms] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [amenitiesList, setAmenitiesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [maxPriceLimit, setMaxPriceLimit] = useState(10000);
    
    const [filters, setFilters] = useState({
        search: '',
        category: 'All',
        minPrice: 0,
        maxPrice: 10000,
        guests: 'All',
        amenities: [],
        sortBy: 'Latest'
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [roomData, typeData, amenityData] = await Promise.all([
                    cachedGet('/rooms'),
                    cachedGet('/room-types'),
                    cachedGet('/amenities')
                ]);
                
                const prices = roomData.map(r => r.pricePerNight);
                const rawMax = Math.max(...prices, 0) || 10000;
const normalizedMax = Math.ceil(rawMax / 100) * 100;

setMaxPriceLimit(normalizedMax);

setFilters(prev => ({
  ...prev,
  maxPrice: normalizedMax
}));
                
                setRooms(roomData);
                setRoomTypes(typeData);
                setAmenitiesList(amenityData);

                // setFilters(prev => ({ ...prev, maxPrice: max }));

                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredRooms = rooms.filter(room => {
        const matchesSearch = room.name.toLowerCase().includes(filters.search.toLowerCase());
        const matchesCategory = filters.category === 'All' || room.type === filters.category;
        const matchesMinPrice = room.pricePerNight >= Number(filters.minPrice);
        const matchesMaxPrice = room.pricePerNight <= Number(filters.maxPrice);
        const matchesGuests = filters.guests === 'All' || room.maxGuests >= Number(filters.guests);
        const matchesAmenities = filters.amenities.length === 0 || 
            filters.amenities.every(amenity => room.amenities?.includes(amenity));

        return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice && matchesGuests && matchesAmenities;
    });

    const sortedRooms = [...filteredRooms].sort((a, b) => {
        switch (filters.sortBy) {
            case 'Price: Low to High':
                return a.pricePerNight - b.pricePerNight;
            case 'Price: High to Low':
                return b.pricePerNight - a.pricePerNight;
            case 'Capacity: High to Low':
                return b.maxGuests - a.maxGuests;
            case 'Latest':
            default:
                return new Date(b.createdAt) - new Date(a.createdAt);
        }
    });

    const categoryOptions = ['All', ...roomTypes.map((type) => type.name)];

    const handleAmenityToggle = (amenityName) => {
        setFilters(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenityName)
                ? prev.amenities.filter(a => a !== amenityName)
                : [...prev.amenities, amenityName]
        }));
    };

    const resetFilters = () => {
        setFilters({
            search: '',
            category: 'All',
            minPrice: 0,
            maxPrice: maxPriceLimit,
            guests: 'All',
            amenities: [],
            sortBy: 'Latest'
        });
    };

    return (
        <div className="min-h-screen pt-32 pb-20 bg-[#f8fafc]">
            <div className="container mx-auto px-6">
                {/* Page Header & Search */}
                <div className="mb-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <span className="text-[#134941] uppercase tracking-[0.3em] text-[10px] md:text-xs font-bold mb-3 block">Exquisite Selection</span>
                            <h1 className="text-4xl md:text-5xl font-serif text-[#134941] tracking-tight">Our Accommodations</h1>
                        </div>
                        
                        <div className="relative w-full md:w-96 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-water-dark transition-colors" size={18} />
                            <input 
                                type="text"
                                placeholder="Search by room name..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:border-water-dark/50 focus:ring-4 focus:ring-water-dark/5 transition-all text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12">
                                {/* Modern Unified Filter Sidebar */}
                                <aside className="hidden lg:block">
                                    <div className="bg-white rounded-3xl shadow-xl p-8 space-y-8 border border-slate-100 max-w-xs mx-auto sticky top-36">
                                        <h3 className="text-xl font-serif font-semibold text-[#134941] mb-2 tracking-tight">Filters</h3>
                                        {/* Categories */}
                                        <div>
                                            <div className="mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Category</div>
                                            <div className="flex flex-col gap-2">
                                                {categoryOptions.map(option => (
                                                    <button
                                                        key={option}
                                                        onClick={() => setFilters(prev => ({ ...prev, category: option }))}
                                                        className={`text-left px-4 py-2.5 rounded-xl text-sm transition-all border font-medium ${filters.category === option ? 'bg-[#134941] text-white shadow-md border-[#134941]' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-[#134941] border-slate-100'}`}
                                                    >
                                                        {option}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Price Range */}
                                        <div>
                                            <div className="mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Price per night</div>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs font-semibold text-slate-500">₹{filters.minPrice}</span>
                                                <span className="text-xs font-semibold text-slate-500">₹{filters.maxPrice}</span>
                                            </div>
                                            <div className="relative h-10 flex items-center">
                                                {/* Track */}
                                                <div className="absolute left-0 right-0 h-2 rounded-full bg-gradient-to-r from-[#e0f7fa] via-[#b2ebf2] to-[#80deea]" />
                                                {/* Active Range */}
                                                <div
                                                    className="absolute h-2 rounded-full bg-gradient-to-r from-[#134941] via-[#1ecbe1] to-[#80deea] pointer-events-none"
                                                    style={{
                                                        left: `${(filters.minPrice / maxPriceLimit) * 100}%`,
                                                        right: `${100 - (filters.maxPrice / maxPriceLimit) * 100}%`,
                                                    }}
                                                />
                                                {/* Min Thumb */}
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max={maxPriceLimit}
                                                    value={filters.minPrice}
                                                    step="100"
                                                    onChange={e => {
                                                        const value = Math.min(Number(e.target.value), filters.maxPrice - 500);
                                                        setFilters(prev => ({ ...prev, minPrice: value }));
                                                    }}
                                                    className="absolute w-full h-2 bg-transparent appearance-none pointer-events-auto focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#134941] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:active:scale-110 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#134941] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-200 [&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:active:scale-110"
                                                    style={{ zIndex: 2 }}
                                                />
                                                {/* Max Thumb */}
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max={maxPriceLimit}
                                                    value={filters.maxPrice}
                                                    step="100"
                                                    onChange={e => {
                                                        const value = Math.max(Number(e.target.value), filters.minPrice + 500);
                                                        setFilters(prev => ({ ...prev, maxPrice: value }));
                                                    }}
                                                    className="absolute w-full h-2 bg-transparent appearance-none pointer-events-auto focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#134941] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:active:scale-110 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#134941] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-200 [&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:active:scale-110"
                                                    style={{ zIndex: 2 }}
                                                />
                                            </div>
                                            <div className="flex justify-between mt-3">
                                                <span className="text-xs font-semibold text-slate-400">₹0</span>
                                                <span className="text-xs font-semibold text-slate-400">₹{maxPriceLimit}</span>
                                            </div>
                                        </div>

                                        {/* Guests */}
                                        <div>
                                            <div className="mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Guests</div>
                                            <select
                                                value={filters.guests}
                                                onChange={e => setFilters(prev => ({ ...prev, guests: e.target.value }))}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:border-[#134941]/40 shadow-sm appearance-none cursor-pointer font-medium"
                                            >
                                                <option value="All">Any Capacity</option>
                                                {[1, 2, 3, 4, 5, 6].map(num => (
                                                    <option key={num} value={num}>{num}+ Guests</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Amenities */}
                                        <div>
                                            <div className="mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Amenities</div>
                                            <div className="grid grid-cols-1 gap-2.5">
                                                {amenitiesList.map(amenity => (
                                                    <label key={amenity._id} className="flex items-center gap-3 cursor-pointer group">
                                                        <input
                                                            type="checkbox"
                                                            checked={filters.amenities.includes(amenity.name)}
                                                            onChange={() => handleAmenityToggle(amenity.name)}
                                                            className="w-5 h-5 rounded-full border-2 border-slate-200 text-[#134941] focus:ring-[#134941]/20 transition-all cursor-pointer accent-[#134941] shadow-sm"
                                                        />
                                                        <span className={`text-sm transition-colors font-medium ${filters.amenities.includes(amenity.name) ? 'text-[#134941]' : 'text-slate-500 group-hover:text-[#134941]'}`}>{amenity.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={resetFilters}
                                            className="w-full py-4 text-xs uppercase tracking-widest font-bold text-slate-400 hover:text-[#134941] transition-colors border border-dashed border-slate-200 hover:border-[#134941]/30 rounded-2xl mt-2"
                                        >
                                            Reset All Filters
                                        </button>
                                    </div>
                                </aside>

                    {/* Room Grid Area */}
                    <div className="flex-1">
                        {/* Result Info & Sorting (Desktop) */}
                        <div className="hidden lg:flex justify-between items-center mb-8 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-sm text-slate-500 font-medium">
                                Showing <span className="text-water-dark font-bold">{sortedRooms.length}</span> luxury rooms
                            </p>
                            <div className="flex items-center gap-3">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Sort By:</label>
                                <select 
                                    value={filters.sortBy}
                                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                                    className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-water-dark/10 cursor-pointer"
                                >
                                    {['Latest', 'Price: Low to High', 'Price: High to Low', 'Capacity: High to Low'].map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="space-y-6">
                                <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200" />
                                <RoomsGridSkeleton count={6} />
                            </div>
                        ) : (
                            <>
                                {sortedRooms.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                        {sortedRooms.map((room) => (
                                            <RoomCard key={room._id} room={room} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-dashed border-slate-200">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                            <SlidersHorizontal className="text-slate-300" size={32} />
                                        </div>
                                        <h3 className="text-lg font-serif text-slate-900 mb-2">No results found</h3>
                                        <p className="text-slate-500 text-sm max-w-xs text-center mb-8">Try adjusting your filters or search terms to find your perfect room.</p>
                                        <button onClick={resetFilters} className="px-8 py-3 bg-water-dark text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg shadow-water-dark/20 transition-transform active:scale-95">Clear Filters</button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Filter Button */}
            <div className="lg:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
                <button 
                    onClick={() => setIsMobileFilterOpen(true)}
                    className="flex items-center gap-2 px-8 py-4 bg-water-dark text-white text-sm font-bold uppercase tracking-widest rounded-full shadow-2xl shadow-water-dark/40 active:scale-95 transition-transform"
                >
                    <SlidersHorizontal size={18} />
                    Filters {filters.amenities.length + (filters.category !== 'All' ? 1 : 0) > 0 && <span className="bg-white text-water-dark w-5 h-5 rounded-full flex items-center justify-center text-[10px] ml-1">{filters.amenities.length + (filters.category !== 'All' ? 1 : 0)}</span>}
                </button>
            </div>

                        {/* Mobile Filter Modal */}
                        {isMobileFilterOpen && (
                            <div className="fixed inset-0 z-50 lg:hidden overflow-hidden">
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileFilterOpen(false)} />
                                <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-white rounded-t-3xl overflow-y-auto shadow-2xl flex flex-col animate-slideUp">
                                    <div className="sticky top-0 bg-white px-6 py-5 border-b border-slate-100 flex justify-between items-center rounded-t-3xl">
                                        <div className="flex items-center gap-3">
                                            <Filter size={20} className="text-[#134941]" />
                                            <h3 className="font-serif text-xl font-semibold text-[#134941] tracking-tight">Filters</h3>
                                        </div>
                                        <button onClick={() => setIsMobileFilterOpen(false)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-200 transition-colors">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="p-6 space-y-8">
                                        {/* Category */}
                                        <div>
                                            <div className="mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Category</div>
                                            <div className="flex flex-wrap gap-2">
                                                {categoryOptions.map(option => (
                                                    <button
                                                        key={option}
                                                        onClick={() => setFilters(prev => ({ ...prev, category: option }))}
                                                        className={`px-5 py-2.5 rounded-full text-xs font-medium transition-all border ${filters.category === option ? 'bg-[#134941] text-white border-[#134941] shadow-md' : 'bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100 hover:text-[#134941]'}`}
                                                    >
                                                        {option}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Sorting */}
                                        <div>
                                            <div className="mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Sort By</div>
                                            <div className="grid grid-cols-1 gap-2">
                                                {['Latest', 'Price: Low to High', 'Price: High to Low', 'Capacity: High to Low'].map(opt => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => setFilters(prev => ({ ...prev, sortBy: opt }))}
                                                        className={`text-left px-5 py-3.5 rounded-2xl text-sm font-medium transition-all border ${filters.sortBy === opt ? 'bg-[#134941] text-white border-[#134941] shadow-md' : 'bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100 hover:text-[#134941]'}`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Price Range */}
                                        <div>
                                            <div className="mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Price Range</div>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs font-semibold text-slate-500">₹{filters.minPrice}</span>
                                                <span className="text-xs font-semibold text-slate-500">₹{filters.maxPrice}</span>
                                            </div>
                                            <div className="relative h-10 flex items-center px-2">
                                                {/* Track */}
                                                <div className="absolute left-0 right-0 h-2 rounded-full bg-gradient-to-r from-[#e0f7fa] via-[#b2ebf2] to-[#80deea]" />
                                                {/* Active Range */}
                                                <div
                                                    className="absolute h-2 rounded-full bg-gradient-to-r from-[#134941] via-[#1ecbe1] to-[#80deea] pointer-events-none"
                                                    style={{
                                                        left: `${(filters.minPrice / maxPriceLimit) * 100}%`,
                                                        right: `${100 - (filters.maxPrice / maxPriceLimit) * 100}%`,
                                                    }}
                                                />
                                                {/* Min Thumb */}
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max={maxPriceLimit}
                                                    value={filters.minPrice}
                                                    step="100"
                                                    onChange={e => {
                                                        const value = Math.min(Number(e.target.value), filters.maxPrice - 500);
                                                        setFilters(prev => ({ ...prev, minPrice: value }));
                                                    }}
                                                    className="absolute w-full h-2 bg-transparent appearance-none pointer-events-auto focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#134941] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:active:scale-110 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#134941] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-200 [&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:active:scale-110"
                                                    style={{ zIndex: 2 }}
                                                />
                                                {/* Max Thumb */}
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max={maxPriceLimit}
                                                    value={filters.maxPrice}
                                                    step="100"
                                                    onChange={e => {
                                                        const value = Math.max(Number(e.target.value), filters.minPrice + 500);
                                                        setFilters(prev => ({ ...prev, maxPrice: value }));
                                                    }}
                                                    className="absolute w-full h-2 bg-transparent appearance-none pointer-events-auto focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#134941] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:active:scale-110 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#134941] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-200 [&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:active:scale-110"
                                                    style={{ zIndex: 2 }}
                                                />
                                            </div>
                                            <div className="flex justify-between mt-2 px-2">
                                                <span className="text-xs font-semibold text-slate-400">₹0</span>
                                                <span className="text-xs font-semibold text-slate-400">₹{maxPriceLimit}</span>
                                            </div>
                                        </div>

                                        {/* Guests Capacity */}
                                        <div>
                                            <div className="mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Guests</div>
                                            <div className="flex flex-wrap gap-2">
                                                {['All', '1', '2', '3', '4', '6'].map(num => (
                                                    <button
                                                        key={num}
                                                        onClick={() => setFilters(prev => ({ ...prev, guests: num }))}
                                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-medium border transition-all ${filters.guests === num ? 'bg-[#134941] text-white border-[#134941] shadow-md' : 'bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100 hover:text-[#134941]'}`}
                                                    >
                                                        {num === 'All' ? 'Any' : num}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Amenities */}
                                        <div>
                                            <div className="mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Amenities</div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {amenitiesList.map(amenity => (
                                                    <button
                                                        key={amenity._id}
                                                        onClick={() => handleAmenityToggle(amenity.name)}
                                                        className={`flex items-center gap-3 p-3 rounded-2xl border text-sm font-medium transition-all ${filters.amenities.includes(amenity.name) ? 'bg-[#134941] border-[#134941] text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100 hover:text-[#134941]'}`}
                                                    >
                                                        <div className={`w-2 h-2 rounded-full ${filters.amenities.includes(amenity.name) ? 'bg-white animate-pulse' : 'bg-slate-200'}`} />
                                                        {amenity.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Sticky Action Bar */}
                                    <div className="sticky bottom-0 p-6 bg-white border-t border-slate-100 flex gap-4 rounded-b-3xl shadow-t-xl z-10">
                                        <button onClick={resetFilters} className="flex-1 py-4 bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest rounded-2xl hover:bg-slate-100 hover:text-[#134941] transition-colors">Reset</button>
                                        <button onClick={() => setIsMobileFilterOpen(false)} className="flex-[2] py-4 bg-[#134941] text-white text-xs font-bold uppercase tracking-widest rounded-2xl shadow-lg shadow-[#134941]/20 hover:bg-[#17695e] transition-colors">Apply Filters</button>
                                    </div>
                                </div>
                            </div>
                        )}
        </div>
    );
};

const FilterSection = ({ title, children }) => (
    <div className="space-y-4">
        <h4 className="text-[11px] uppercase font-bold text-slate-400 tracking-[0.2em] px-1">{title}</h4>
        {children}
    </div>
);

export default Rooms;
