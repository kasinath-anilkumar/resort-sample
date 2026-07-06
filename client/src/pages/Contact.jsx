import { motion } from 'framer-motion';
import { Mail, MapPin, MessageSquare, Phone, Send } from 'lucide-react';
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

const Contact = () => {
    const location = useLocation();
    const [form, setForm] = useState({ 
        name: '', 
        email: '', 
        subject: location.state?.subject || '', 
        message: location.state?.message || '' 
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            toast.success("Thank you. We'll be in touch shortly.");
            setForm({ name: '', email: '', subject: '', message: '' });
            setLoading(false);
        }, 800);
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] pt-32 pb-20 relative overflow-hidden flex items-center">
            {/* Background luxury glowing orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#134941]/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-slate-200 blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-5xl mx-auto">
                    
                    {/* Header */}
                    <div className="text-center mb-12">
                        <span className="text-[#134941] uppercase tracking-[0.3em] text-[10px] sm:text-xs font-bold mb-3 block">
                            Connect with Us
                        </span>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif tracking-tight text-slate-900 mb-4">
                            Reach Out
                        </h1>
                        <p className="text-slate-600 text-sm max-w-xl mx-auto leading-relaxed">
                            Whether you have questions about custom bookings, events, or simply want to learn more about the Vezhambal experience, we are here to assist.
                        </p>
                    </div>

                    {/* Compact Integrated Grid Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="grid grid-cols-1 md:grid-cols-5 rounded-3xl border border-slate-100 bg-white shadow-xl overflow-hidden"
                    >
                        {/* Info Column (col-span-2) */}
                        <div className="md:col-span-2 bg-gradient-to-br from-[#134941] to-[#0a2e29] p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100 text-white">
                            <div className="space-y-6">
                                <h3 className="text-lg sm:text-xl font-serif text-white tracking-wide border-b border-white/20 pb-3">
                                    Resort Details
                                </h3>
                                <p className="text-white/70 text-xs sm:text-sm font-light leading-relaxed">
                                    Our concierge circle is available 24/7. Get in touch directly, or send us a message and we will respond within 2 hours.
                                </p>
                            </div>

                            <div className="space-y-6 mt-10 md:mt-0">
                                <ContactItem icon={<Phone />} label="Reservations" value="+1 (234) 567-8900" />
                                <ContactItem icon={<Mail />} label="Email Us" value="concierge@vezhambal.com" />
                                <ContactItem icon={<MapPin />} label="Global Office" value="123 Paradise Road, Ocean View, Maldives" />
                            </div>
                        </div>

                        {/* Form Column (col-span-3) */}
                        <div className="md:col-span-3 p-6 sm:p-8 bg-white">
                            <h3 className="text-lg sm:text-xl font-serif text-slate-900 tracking-wide border-b border-slate-100 pb-3 mb-6 flex items-center gap-2">
                                <MessageSquare className="text-[#134941]" size={18} /> Send a Message
                            </h3>
                            
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Full Name</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="John Doe"
                                            value={form.name}
                                            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#134941] focus:border-[#134941] transition-all text-sm text-slate-800 placeholder:text-slate-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            placeholder="john@example.com"
                                            value={form.email}
                                            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#134941] focus:border-[#134941] transition-all text-sm text-slate-800 placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Subject</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Reservation Inquiry"
                                        value={form.subject}
                                        onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#134941] focus:border-[#134941] transition-all text-sm text-slate-800 placeholder:text-slate-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Your Message</label>
                                    <textarea
                                        required
                                        placeholder="How can we assist you today?"
                                        value={form.message}
                                        onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#134941] focus:border-[#134941] transition-all text-sm text-slate-800 placeholder:text-slate-400 h-28 resize-none"
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full py-3 px-6 bg-[#134941] hover:bg-[#1a5b51] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-md active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? 'Sending Inquiries...' : 'Send Inquiry'}
                                    {!loading && <Send size={15} />}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

const ContactItem = ({ icon, label, value }) => (
    <div className="flex gap-4 items-center">
        <div className="p-3 bg-white/10 text-white rounded-full border border-white/10 flex items-center justify-center">
            {React.cloneElement(icon, { size: 18 })}
        </div>
        <div>
            <p className="text-[10px] uppercase tracking-widest text-white/50 mb-0.5">{label}</p>
            <p className="text-sm font-medium text-white">{value}</p>
        </div>
    </div>
);

export default Contact;
