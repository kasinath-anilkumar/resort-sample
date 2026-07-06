import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

const BookingSuccess = () => {
    const { id } = useParams();

    return (
        <div className="min-h-screen pt-32 pb-20 flex items-center justify-center px-6 text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-xl"
            >
                <div className="glass-card !p-12 text-center border-beige/10">
                    <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle size={40} />
                    </div>
                    <h1 className="text-4xl font-serif mb-4">Reservation Confirmed</h1>
                    <p className="text-slate-500 mb-10 max-w-sm mx-auto uppercase tracking-widest text-xs italic">
                        Your luxury experience awaits. A confirmation email has been sent to you.
                    </p>
                    <div className="flex flex-col gap-4">
                        <Link to="/dashboard" className="btn-beige">View My Bookings</Link>
                        <Link to="/" className="text-slate-500 hover:text-slate-900 uppercase tracking-widest text-[10px] py-2 transition-all">Return Home</Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default BookingSuccess;
