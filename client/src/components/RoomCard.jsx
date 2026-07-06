import { motion } from 'framer-motion';
import { Coffee, Star, Tv, Users, Wifi, Wind } from 'lucide-react';
import { Link } from 'react-router-dom';

const amenityIcons = {
    Wifi: <Wifi size={12} />,
    AC: <Wind size={12} />,
    Breakfast: <Coffee size={12} />,
    TV: <Tv size={12} />,
    Spa: <Star size={12} />,
};

const RoomCard = ({ room }) => {
    const displayAmenities = room.amenities?.slice(0, 3) || ['Wifi', 'AC'];

    const imageUrl =
        room.images?.[0] ||
        'https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&w=800&q=80';

    return (
        <Link to={`/rooms/${room._id}`} className="block group">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="rounded overflow-hidden bg-white shadow transition-all duration-500 h-[350px] md:h-[400px] flex flex-col"
            >
                {/* Image */}
                <div className="relative h-[180px] md:h-[220px] overflow-hidden">
                    <img
                        src={imageUrl}
                        alt={room.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />

                    {/* Strong Gradient for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                    {/* Price */}
                    <div className="absolute top-4 right-4 bg-white/95 px-3 py-1 rounded-full text-xs font-semibold shadow">
                        ₹{room.pricePerNight} / night
                    </div>

                    {/* Title on image (only title, keep it minimal) */}
                    <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-white text-lg font-semibold leading-tight">
                            {room.name}
                        </h3>
                    </div>
                </div>

                {/* Content BELOW image (important UX fix) */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs uppercase tracking-wider text-slate-500">
                            {room.type}
                        </span>

                        <span className="flex items-center gap-1 text-sm text-slate-600">
                            <Users size={14} /> Base {room.maxGuests}
                        </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4 line-clamp-2">
                        {room.description}
                    </p>

                    {/* Amenities */}
                    <div className="grid grid-cols-4 gap-2">
                        {displayAmenities.map((amenity) => (
                            <span
                                key={amenity}
                                className="flex items-center gap-1 text-xs bg-slate-100 px-2 py-1 rounded-md text-slate-600"
                            >
                                {amenityIcons[amenity] || <Star size={12} />}
                                {amenity}
                            </span>
                        ))}
                    </div>
                </div>
            </motion.div>
        </Link>
    );
};

export default RoomCard;
