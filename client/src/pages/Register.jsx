import { motion } from 'framer-motion';
import { ArrowRight, Loader2, Lock, Mail, User } from 'lucide-react';
import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import FormField from '../components/FormField';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { register, loading } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await register(name, email, password);
        if (result.success) {
            toast.success('Account created successfully!');
            navigate('/');
        } else {
            toast.error(result.message);
        }
    };

    return (
        <div className="min-h-screen pt-32 pb-20 flex items-center justify-center px-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="form-card p-10">
                    <div className="text-center mb-10">
                        <Link to="/" className="text-2xl font-serif font-bold tracking-[0.3em] text-beige mb-8 block">GRAND HORIZON</Link>
                        <h2 className="text-3xl font-serif">Create Account</h2>
                        <p className="text-slate-500 text-xs mt-2 uppercase tracking-widest italic">Join the circle of absolute luxury</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <FormField
                            id="register-name"
                            label="Full Name"
                            type="text"
                            icon={User}
                            placeholder="Your Name"
                            value={name}
                            onChange={setName}
                        />

                        <FormField
                            id="register-email"
                            label="Email Address"
                            type="email"
                            icon={Mail}
                            placeholder="name@example.com"
                            value={email}
                            onChange={setEmail}
                        />

                        <FormField
                            id="register-password"
                            label="Password"
                            type="password"
                            icon={Lock}
                            placeholder="••••••••"
                            value={password}
                            onChange={setPassword}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="form-submit flex items-center justify-center gap-3 group"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Register'}
                            {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-slate-600 text-xs uppercase tracking-widest">
                            Already have an account? <Link to="/login" className="text-beige border-b border-beige/20 hover:border-beige transition-all ml-2 font-bold">Sign In</Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
