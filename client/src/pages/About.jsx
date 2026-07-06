import { motion } from 'framer-motion';
import { Award, Compass, Globe, Users } from 'lucide-react';
import React from 'react';

const About = () => {
    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-800 pt-32 pb-20 relative overflow-hidden">
            {/* Background luxury glowing orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#134941]/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-slate-200 blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                {/* Hero Section */}
                <div className="max-w-3xl mx-auto text-center mb-20">
                    <span className="text-[#134941] uppercase tracking-[0.3em] text-[10px] sm:text-xs font-bold mb-4 block">Our Legacy</span>
                    <h1 className="text-4xl md:text-6xl font-serif tracking-tight text-slate-900 mb-6 leading-tight">
                        A Journey Through <br />
                        <span className="text-[#134941] italic font-light">Pure Serenity</span>
                    </h1>
                    <div className="h-0.5 w-20 bg-[#134941]/30 mx-auto mb-8" />
                    <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-light">
                        Founded on the principles of quiet luxury and anticipatory hospitality, Vezhambal has been a sanctuary for world travelers seeking absolute rejuvenation. Our story is written in the details of bespoke care, Maldivian heritage, and holistic peace.
                    </p>
                </div>

                {/* Main Vision & Stats Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center mb-32">
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }} 
                        whileInView={{ opacity: 1, x: 0 }} 
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="lg:col-span-6 relative"
                    >
                        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-[#134941]/10 to-transparent blur-md pointer-events-none" />
                        <img 
                            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
                            alt="Luxury Resort Sanctuary" 
                            className="relative rounded-3xl shadow-xl border border-slate-100 object-cover w-full h-[400px] hover:scale-[1.01] transition-transform duration-500" 
                        />
                    </motion.div>

                    <div className="lg:col-span-6 space-y-6">
                        <span className="text-[#134941] uppercase tracking-wider text-xs font-bold block">The Vezhambal Vision</span>
                        <h2 className="text-3xl sm:text-4xl font-serif text-slate-900 leading-tight">
                            Crafting Moments of Timeless Seclusion
                        </h2>
                        <p className="text-slate-600 text-sm leading-relaxed font-light">
                            We believe that luxury is not just defined by gold ornaments or high ceilings, but by the quiet spaces and slow hours that let you breathe. Our retreat is designed to offer complete physical seclusion and bespoke hospitality, anticipating your choices with silent grace.
                        </p>

                        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-200">
                            <div>
                                <h4 className="text-[#134941] text-2xl sm:text-3xl font-serif mb-1">30+</h4>
                                <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">Years of Excellence</p>
                            </div>
                            <div>
                                <h4 className="text-[#134941] text-2xl sm:text-3xl font-serif mb-1">150</h4>
                                <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">Bespoke Suites</p>
                            </div>
                            <div>
                                <h4 className="text-[#134941] text-2xl sm:text-3xl font-serif mb-1">4</h4>
                                <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">Private Lagoons</p>
                            </div>
                            <div>
                                <h4 className="text-[#134941] text-2xl sm:text-3xl font-serif mb-1">99%</h4>
                                <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">Guest Satisfaction</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features & Anchors Section */}
                <div className="space-y-12">
                    <div className="text-center">
                        <span className="text-[#134941] uppercase tracking-wider text-xs font-bold block mb-2">Our Pillars</span>
                        <h2 className="text-2xl sm:text-3xl font-serif text-slate-900">The Core Philosophy</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <AboutCard 
                            icon={<Award />} 
                            title="Awarded Comfort" 
                            desc="Globally recognized standards of safe, premium accommodation." 
                        />
                        <AboutCard 
                            icon={<Users />} 
                            title="Bespoke Service" 
                            desc="Dedicated personal butler and concierge teams at your service 24/7." 
                        />
                        <AboutCard 
                            icon={<Globe />} 
                            title="Eco-Conscious Luxury" 
                            desc="Dedicated preservation of marine biomes and sustainable energy choices." 
                        />
                        <AboutCard 
                            icon={<Compass />} 
                            title="Holistic Wellness" 
                            desc="Restorative therapies designed for mental and physical recovery." 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const AboutCard = ({ icon, title, desc }) => (
    <motion.div 
        whileHover={{ y: -5 }}
        className="p-6 rounded-2xl border border-slate-100 bg-white shadow-md flex flex-col items-center text-center space-y-4 hover:shadow-xl hover:border-[#134941]/30 transition-all duration-300"
    >
        <div className="p-3 bg-[#134941]/10 text-[#134941] rounded-full border border-[#134941]/15">
            {React.cloneElement(icon, { size: 24 })}
        </div>
        <h3 className="text-base sm:text-lg font-serif font-bold text-slate-900">{title}</h3>
        <p className="text-slate-500 text-xs sm:text-sm font-light leading-normal">{desc}</p>
    </motion.div>
);

export default About;
