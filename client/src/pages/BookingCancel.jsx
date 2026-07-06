import { motion } from 'framer-motion';
import { Phone, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const BookingCancel = () => {
    return (
        <div className="min-h-screen pt-32 pb-20 flex items-center justify-center px-6 text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <div className="glass-card !p-12 text-center border-beige/10">
                    <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8">
                        <XCircle size={40} />
                    </div>
                    <h1 className="text-4xl font-serif mb-4">Reservation Cancelled</h1>
                    <p className="text-slate-500 mb-10 max-w-sm mx-auto text-sm">
                        Don't worry, your payment was not processed. Feel free to explore other dates or rooms.
                    </p>
                    <div className="flex flex-col gap-4">
                        <Link to="/rooms" className="btn-beige">Back to Rooms</Link>
                        <Link to="/" className="text-slate-500 hover:text-slate-900 uppercase tracking-widest text-[10px] py-2 transition-all font-bold">Home</Link>
                    </div>
                </div>
                <Link to="/contact" className="btn-outline-beige flex items-center gap-2 justify-center mt-6">
                    Contact Support <Phone size={18} />
                </Link>
            </motion.div>
        </div>
    );
};

export default BookingCancel;
