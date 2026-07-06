import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroImg from '../assets/resort_hero.png'

const Hero = () => {
    return (
        <section className="relative h-screen flex items-center justify-center overflow-hidden">

            {/* Background */}
            <div className="absolute inset-0">
                <img
                    src={heroImg}
                    alt="Resort"
                    className="w-full h-full object-cover"
                />

                {/* Cinematic Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/30 to-transparent" />
            </div>

            {/* Content */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="relative text-center px-6"
            >

                {/* Tagline */}
                <p className="text-[10px] uppercase tracking-[0.5em] text-white/70 mb-6">
                    Resort • Reimagined
                </p>

                {/* Heading */}
                <h1 className="text-4xl md:text-6xl lg:text-[3.5rem] font-serif text-[#f0f0f0]/90 leading-[1.1]">
                    Calm, modern luxury for pure
                    <br />
                    <span className="text-accent font-medium">
                        relaxation
                    </span>
                </h1>

                {/* CTA (Glass Button Only) */}
                <div className="mt-10">
                    <Link
                        to="/rooms"
                        className="
      inline-flex items-center justify-center
      px-8 py-3
      text-white text-sm font-medium
      border border-white/30 rounded-md

      transition-all duration-300

      hover:bg-white/10
      hover:backdrop-blur-md
      hover:border-white/40
      hover:shadow-[0_10px_30px_rgba(0,0,0,0.25)]
      hover:scale-[1.04]
    "
                    >
                        Explore Rooms
                    </Link>
                </div>

            </motion.div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, 8, 0] }}
                transition={{ delay: 1.2, duration: 1.5, repeat: Infinity }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/80"
            >
                <div className="flex flex-col items-center gap-2 text-[10px] tracking-[0.3em] uppercase">
                    Scroll
                    <ChevronDown size={18} />
                </div>
            </motion.div>

        </section>
    );
};

export default Hero;