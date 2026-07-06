import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, LogOut, Menu, User, X } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Header = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen]);

    const handleLogout = () => {
        logout();
        navigate('/');
        setIsMobileMenuOpen(false);
    };

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Rooms', path: '/rooms' },
        { name: 'Packages', path: '/packages' },
        { name: 'About', path: '/about' },
        { name: 'Contact', path: '/contact' },
    ];

    const textTone = isScrolled
        ? 'text-slate-700 hover:text-[#1b6b5f]'
        : 'text-white/90 hover:text-[#134941]';

    const accentTone = isScrolled ? 'text-black' : 'text-black';

    return (
        <header
            className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${isScrolled
                ? 'py-2 sm:py-3 bg-white shadow-lg shadow-black/5'
                : 'py-3 sm:py-4 lg:py-6 bg-[#f5f8f7]'
                }`}
        >
            <div className="mx-auto sm:px-12 md:px-6 flex justify-between items-center">

                {/* Logo */}
                <div className="flex-shrink-0">
                    <Link to="/">
                        <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-wide transition-colors duration-300 ${isScrolled ? 'text-[#004422]' : 'text-black'}`}>
                            Vezhambal
                        </h1>
                    </Link>
                </div>

                {/* Desktop Nav — visible from lg (1024px) and up */}
                <nav className="hidden lg:flex items-center gap-6 xl:gap-10">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            className={`text-xs xl:text-sm uppercase tracking-widest transition-colors duration-300 whitespace-nowrap text-black`}
                        >
                            {link.name}
                        </Link>
                    ))}

                    {user ? (
                        <div
                            className={`flex items-center gap-4 xl:gap-6 pl-4 xl:pl-6 border-l ${isScrolled ? 'border-slate-200' : 'border-white/30'
                                }`}
                        >
                            {user.isAdmin ? (
                                <a
                                    href={import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174'}
                                    className={`flex items-center gap-2 transition-colors duration-300 ${accentTone}`}
                                >
                                    <LayoutDashboard size={18} />
                                    <span className="text-xs xl:text-sm uppercase tracking-widest">
                                        {user.name.split(' ')[0]}
                                    </span>
                                </a>
                            ) : (
                                <Link
                                    to="/dashboard"
                                    className={`flex items-center gap-2 transition-colors duration-300 ${accentTone}`}
                                >
                                    <User size={18} />
                                    <span className="text-xs xl:text-sm uppercase tracking-widest">
                                        {user.name.split(' ')[0]}
                                    </span>
                                </Link>
                            )}

                            <button
                                onClick={handleLogout}
                                className={`transition-colors duration-300 ${isScrolled
                                    ? 'text-slate-500 hover:text-red-500'
                                    : 'text-[#f4d98b] hover:text-red-400'
                                    }`}
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    ) : (
                        <Link
                            to="/login"
                            className={`bg-[#1b6b5f] hover:bg-[#155a50] !py-2 !px-5 xl:!px-6 text-xs rounded text-white shadow-sm transition-all duration-300 whitespace-nowrap ${isScrolled ? 'shadow-[#1b6b5f]/20' : 'shadow-black/20'}`}
                        >
                            Login/Register
                        </Link>
                    )}
                </nav>

                {/* Mobile/Tablet Menu Toggle — visible below lg */}
                <button
                    className={`lg:hidden p-2 -mr-2 text-black`}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
                </button>
            </div>

            {/* Mobile/Tablet Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[60] bg-white flex flex-col lg:hidden shadow-2xl overflow-y-auto"
                    >
                        <div className="flex justify-between items-center px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100">
                            <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                                <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#134941]">
                                    Vezhambal
                                </span>
                            </Link>
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2 bg-slate-100 rounded-full text-slate-900 hover:bg-slate-200 transition-colors"
                                aria-label="Close menu"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <nav className="flex-1 px-4 sm:px-6 py-8 sm:py-10">
                            <ul className="space-y-1">
                                {navLinks.map((link, i) => (
                                    <motion.li
                                        key={link.name}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.05 * i + 0.2 }}
                                    >
                                        <Link
                                            to={link.path}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="text-xl sm:text-2xl font-semibold tracking-wide block py-3 sm:py-4 text-slate-800 hover:text-[#1b6b5f] transition-colors border-b border-slate-100"
                                        >
                                            {link.name}
                                        </Link>
                                    </motion.li>
                                ))}

                                {user ? (
                                    <motion.li
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.05 * navLinks.length + 0.2 }}
                                        className="pt-6 sm:pt-8"
                                    >
                                        <div className="flex flex-col gap-4 sm:gap-5">
                                            {user.isAdmin ? (
                                                <a
                                                    href={import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174'}
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                    className="text-[#134941] text-base sm:text-lg font-semibold uppercase tracking-widest flex items-center gap-3 py-2"
                                                >
                                                    <LayoutDashboard size={20} /> {user.name}
                                                </a>
                                            ) : (
                                                <Link
                                                    to="/dashboard"
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                    className="text-[#134941] text-base sm:text-lg font-semibold uppercase tracking-widest flex items-center gap-3 py-2"
                                                >
                                                    <User size={20} /> {user.name}
                                                </Link>
                                            )}

                                            <button
                                                onClick={handleLogout}
                                                className="text-red-500 text-base sm:text-lg font-semibold uppercase tracking-widest flex items-center gap-3 py-2 hover:text-red-600 transition-colors"
                                            >
                                                <LogOut size={20} /> Sign Out
                                            </button>
                                        </div>
                                    </motion.li>
                                ) : (
                                    <motion.li
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.05 * navLinks.length + 0.2 }}
                                        className="pt-6 sm:pt-8"
                                    >
                                        <Link
                                            to="/login"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="bg-[#1b6b5f] hover:bg-[#155a50] w-full block text-center py-3 sm:py-4 rounded-lg text-white font-semibold text-base sm:text-lg tracking-wide transition-colors"
                                        >
                                            Login / Register
                                        </Link>
                                    </motion.li>
                                )}
                            </ul>
                        </nav>

                        <div className="px-4 sm:px-6 py-4 sm:py-6 border-t border-slate-100 text-center">
                            <p className="text-slate-400 text-[10px] sm:text-xs uppercase tracking-[0.3em]">
                                Excellence in Hospitality
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Header;