import { ArrowRight, Loader2, Lock, Mail } from 'lucide-react';
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
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
            toast.success('Welcome to Admin Portal!');
            navigate('/');
        } else {
            toast.error(result.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f7faf8] px-6">
            <div className="w-full max-w-md form-card p-8 border border-slate-200 shadow-xl bg-white rounded-3xl">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-serif mb-2 text-[#1b6b5f] font-bold">Vezhambal</h2>
                    <p className="text-slate-500 text-sm italic">Admin Control Center</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="form-label block text-xs font-bold uppercase text-slate-500 mb-2">Email Address</label>
                        <div className="relative">
                            <input
                                id="login-email"
                                type="email"
                                placeholder="admin@resort.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-2xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:border-[#1b6b5f] px-5 py-4 pl-12"
                                required
                            />
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        </div>
                    </div>

                    <div>
                        <label className="form-label block text-xs font-bold uppercase text-slate-500 mb-2">Password</label>
                        <div className="relative">
                            <input
                                id="login-password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-2xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:border-[#1b6b5f] px-5 py-4 pl-12"
                                required
                            />
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-[#1b6b5f] text-white text-sm font-semibold rounded-2xl hover:bg-[#15564d] transition-colors disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Log In'}
                        {!loading && <ArrowRight size={20} />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
