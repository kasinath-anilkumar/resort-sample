import { motion } from 'framer-motion';
import { ArrowRight, Loader2, Lock, Mail } from 'lucide-react';
import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import FormField from '../components/FormField';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, loading } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(email, password);
        if (result.success) {
            toast.success('Welcome back!');
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
                className="w-full max-w-md form-card p-8"
            >
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-serif mb-2">Welcome Back</h2>
                    <p className="text-slate-500 text-sm italic">Sign in to your luxury sanctuary</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <FormField
                        id="login-email"
                        label="Email Address"
                        type="email"
                        icon={Mail}
                        placeholder="name@example.com"
                        value={email}
                        onChange={setEmail}
                    />

                    <FormField
                        id="login-password"
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
                        className="form-submit flex items-center justify-center gap-2 group"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Sign In'}
                        {!loading && <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-600">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-beige hover:underline">
                        Create one now
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
