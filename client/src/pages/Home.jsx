import { motion } from 'framer-motion';
import { Award, Heart, ShieldCheck, Star } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import { HomeRoomsSkeleton } from '../components/LoadingSkeleton';
import RoomCard from '../components/RoomCard';
import { cachedGet } from '../utils/cache';

const Home = () => {
    const [rooms, setRooms] = useState([]);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [roomsData, packagesData] = await Promise.all([
                    cachedGet('/rooms'),
                    cachedGet('/packages')
                ]);
                
                // Sort by createdAt descending and show all rooms
                const sortedRooms = roomsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setRooms(sortedRooms);
                setPackages(packagesData);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

const features = [
  {
    icon: <Star />,
    title: 'Refined Dining',
    desc: 'Curated culinary experiences.'
  },
  {
    icon: <Award />,
    title: 'Recognized Excellence',
    desc: 'Awarded for luxury and service.'
  },
  {
    icon: <ShieldCheck />,
    title: 'Private Escape',
    desc: 'Designed for quiet and comfort.'
  },
  {
    icon: <Heart />,
    title: 'Wellness Rituals',
    desc: 'Personalized spa experiences.'
  },
];

    return (
        <div>
            <Hero />

            {/* Featured Rooms Section */}
            <section className="py-12 bg-white overflow-hidden">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-7 gap-6">
                        <div>
                            <span className="text-black uppercase tracking-[0.3em] text-[10px] md:text-xs font-bold mb-4 block">World Class Accommodations</span>
                            <h2 className="text-black text-4xl md:text-6xl font-serif tracking-tight">
                                Find Your Perfect Space
                            </h2>
                        </div>
                        <Link
                            to="/rooms"
                            className="btn-outline-beige !py-2 !px-6 text-xs"
                        >
                            View All Rooms
                        </Link>
                    </div>

                    {loading ? (
                        <HomeRoomsSkeleton count={4} />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                            {rooms.map((room) => (
                                <RoomCard key={room._id} room={room} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Poster Section */}
            <section className="relative py-20 overflow-hidden bg-white">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="relative h-[60vh] md:h-[70vh] lg:h-[80vh] rounded-2xl overflow-hidden shadow-2xl"
                    >
                        {/* Background Image */}
                        <img
                            src="https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=2000&q=80"
                            alt="Luxury Resort Experience"
                            className="w-full h-full object-cover"
                        />

                        {/* Content */}
                        <div className="absolute inset-0 flex items-center">
                            <div className="max-w-2xl px-8 md:px-12 lg:px-16">
                                <motion.div
                                    initial={{ opacity: 0, x: -50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3, duration: 0.8 }}
                                    viewport={{ once: true }}
                                >
                                    <span className="text-beige uppercase tracking-[0.4em] text-xs md:text-sm font-medium mb-4 block">
                                        Experience Luxury
                                    </span>

                                    <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif text-white leading-tight mb-6">
                                        Where Dreams
                                        <br />
                                        Become Reality
                                    </h2>

                                    <p className="text-white/80 text-lg md:text-xl leading-relaxed mb-8 max-w-lg">
                                        Discover unparalleled luxury and serenity in our world-class resort,
                                        where every moment is crafted for your ultimate comfort and pleasure.
                                    </p>

                                    <button className="
                                        relative overflow-hidden
                                        px-8 py-4
                                        bg-beige text-black
                                        text-sm font-semibold tracking-wide
                                        rounded-lg

                                        transition-all duration-500

                                        hover:bg-white
                                        hover:scale-105
                                        hover:shadow-[0_10px_40px_rgba(0,0,0,0.3)]
                                    ">
                                        Discover More
                                    </button>
                                </motion.div>
                            </div>
                        </div>

                        {/* Decorative Elements */}
                        <div className="absolute top-8 right-8 w-32 h-32 border border-white/20 rounded-full" />
                        <div className="absolute bottom-8 right-16 w-24 h-24 border border-beige/30 rounded-full" />
                    </motion.div>
                </div>
            </section>

            {/* Features Banner */}
            <section className="relative py-28 overflow-hidden">

                {/* Background Image */}
                <div className="absolute inset-0">
                    <img
                        src="https://images.pexels.com/photos/21348367/pexels-photo-21348367.jpeg"
                        alt="Resort ambience"
                        className="w-full h-full object-cover"
                    />

                    {/* Overlay for readability */}
                    <div className="absolute inset-0 bg-black/60" />
                </div>

                {/* Content */}
                <div className="relative container mx-auto px-6">

                    {/* Header */}
                    <div className="text-center mb-16">
                        <span className="text-white/70 uppercase tracking-[0.35em] text-[10px] mb-4 block">
                            World Class Experience
                        </span>

                        <h2 className="text-3xl md:text-5xl font-serif text-white">
                            Why Grand Horizon
                        </h2>
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6">

                        {features.map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}

                                className="
                                            group p-6 rounded-2xl
                                            backdrop-blur-sm bg-white/10
                                            border border-white/20
                                            text-center

                                            transition-all duration-300
                                            hover:bg-white/20
                                            hover:-translate-y-2
                                            hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)]
                                        "
                            >

                                {/* Icon */}
                                <div className="
                                                w-14 h-14 mx-auto mb-5
                                                rounded-full
                                                bg-white/10
                                                border border-white/20
                                                flex items-center justify-center
                                                text-white
                                                group-hover:scale-110 transition
                                            ">
                                    {React.cloneElement(f.icon, { size: 26 })}
                                </div>

                                {/* Title */}
                                <h3 className="text-lg font-serif text-white mb-2">
                                    {f.title}
                                </h3>

                                {/* Description */}
                                <p className="text-white/70 text-sm leading-relaxed">
                                    {f.desc}
                                </p>

                            </motion.div>
                        ))}

                    </div>

                </div>
            </section>

            {/* Featured Section */}
            <section className="py-32 bg-[#002a17] overflow-hidden">
                <div className="container mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">

                    {/* LEFT - IMAGE COMPOSITION */}
                    <motion.div
                        initial={{ opacity: 0, x: -60 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.9 }}
                        className="relative w-full h-[500px]"
                    >

                        {/* Main Image */}
                        <img
                            src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=80"
                            className="absolute top-0 left-0 w-[75%] h-[75%] object-cover rounded-2xl shadow-2xl"
                        />

                        {/* Secondary Image */}
                        <img
                            src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80"
                            className="absolute bottom-0 right-0 w-[60%] h-[60%] object-cover rounded-2xl shadow-xl border border-white/10"
                        />

                        {/* Small Floating Image */}
                        <img
                            src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80"
                            className="absolute top-[55%] left-[10%] w-40 h-40 object-cover rounded-xl shadow-lg border border-white/10"
                        />

                        {/* Soft Glow */}
                        <div className="absolute -inset-10 bg-white/5 blur-3xl rounded-full -z-10" />
                    </motion.div>

                    {/* RIGHT - CONTENT */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9 }}
                        className="max-w-xl"
                    >

                        <span className="text-beige uppercase tracking-[0.4em] text-[10px] mb-5 block">
                            Unmatched Comfort
                        </span>

                        <h2 className="text-4xl md:text-5xl font-serif text-white leading-tight mb-6">
                            The Perfect Haven
                            <br />
                            for Your Escape
                        </h2>

                        <p className="text-white/60 leading-relaxed mb-10">
                            Experience refined living through thoughtfully designed spaces, serene surroundings, and timeless comfort that transforms every stay into something unforgettable.
                        </p>

                        {/* CTA */}
                        <button className="
                                            relative overflow-hidden
                                            px-8 py-3
                                            text-white text-sm font-medium tracking-wide
                                            border border-white/30 rounded-md

                                            transition-all duration-500

                                            hover:bg-white/10
                                            hover:backdrop-blur-md
                                            hover:border-white/50
                                            hover:shadow-[0_10px_40px_rgba(0,0,0,0.35),0_0_20px_rgba(255,255,255,0.1)]
                                            hover:scale-[1.05]
                                        ">
                            Learn More
                        </button>

                    </motion.div>

                </div>
            </section>

            {/* Packages Section */}
            <section className="py-32 bg-white overflow-hidden">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                        <div>
                            <span className="text-black uppercase tracking-[0.3em] text-[10px] md:text-xs font-bold mb-4 block">Special Packages</span>
                            <h2 className="text-black text-4xl md:text-6xl font-serif tracking-tight">
                                Exclusive Getaways
                            </h2>
                        </div>
                        <Link
                            to="/packages"
                            className="btn-outline-beige !py-2 !px-6 text-xs"
                        >
                            View All Packages
                        </Link>
                    </div>

                    {packages.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-slate-600 text-lg">No packages available at the moment.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {packages.slice(0, 3).map((pkg) => (
                                <motion.div
                                    key={pkg._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                    viewport={{ once: true }}
                                    className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                                >
                                    {/* Image */}
                                    <div className="relative h-72 overflow-hidden bg-slate-100">
                                        <img
                                            src={pkg.image}
                                            alt={pkg.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        {pkg.discount > 0 && (
                                            <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                                -{pkg.discount}%
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        <h3 className="text-xl font-serif text-black mb-2">{pkg.name}</h3>
                                        <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                                            {pkg.description}
                                        </p>

                                        {/* Duration and Capacity */}
                                        <div className="flex justify-between items-center mb-4 pb-4 border-b">
                                            <span className="text-sm text-slate-500">📅 {pkg.duration}</span>
                                            <span className="text-sm text-slate-500">👥 {pkg.capacity} guests</span>
                                        </div>

                                        {/* Price and CTA */}
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-xs text-slate-500">From</p>
                                                <p className="text-2xl font-serif text-black">${pkg.price}</p>
                                            </div>
                                            <Link
                                                to="/packages"
                                                className="btn-primary px-4 py-2 text-xs"
                                            >
                                                Explore
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Home;
