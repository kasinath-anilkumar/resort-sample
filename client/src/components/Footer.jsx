import { Facebook, Instagram, Mail, MapPin, Phone, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-water-light pt-20 pb-10 border-t border-water/30">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-1">
                        <Link to="/" className="text-2xl font-serif font-bold tracking-[0.2em] text-charcoal mb-6 block">
                            Vezhambal
                        </Link>
                        <p className="text-charcoal/70 leading-loose">
                            Experience the pinnacle of luxury and serenity at Vezhambal. Your sanctuary of elegance and unmatched hospitality.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-charcoal uppercase tracking-widest mb-8 font-semibold">Quick Links</h4>
                        <ul className="space-y-4 text-charcoal/70">
                            <li><Link to="/rooms" className="hover:text-charcoal transition-colors">Rooms & Suites</Link></li>
                            <li><Link to="/about" className="hover:text-charcoal transition-colors">Our Story</Link></li>
                            <li><Link to="/contact" className="hover:text-charcoal transition-colors">Contact Us</Link></li>
                            <li><Link to="/" className="hover:text-charcoal transition-colors">Home</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-charcoal uppercase tracking-widest mb-8 font-semibold">Contact</h4>
                        <ul className="space-y-4 text-charcoal/70">
                            <li className="flex items-center gap-3">
                                <MapPin size={18} className="text-charcoal" />
                                123 Paradise Road, Ocean View, Maldives
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={18} className="text-charcoal" />
                                +1 (234) 567-8900
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={18} className="text-charcoal" />
                                reservations@vezhambal.com
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-charcoal uppercase tracking-widest mb-8 font-semibold">Follow Us</h4>
                        <div className="flex gap-6">
                            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-3 bg-white/80 rounded-full hover:bg-mint transition-all duration-300 text-charcoal">
                                <Instagram size={20} />
                            </a>
                            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="p-3 bg-white/80 rounded-full hover:bg-mint transition-all duration-300 text-charcoal">
                                <Facebook size={20} />
                            </a>
                            <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="p-3 bg-white/80 rounded-full hover:bg-mint transition-all duration-300 text-charcoal">
                                <Twitter size={20} />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="pt-10 border-t border-slate-200/60 text-center text-charcoal/50 text-sm tracking-widest uppercase">
                    &copy; {new Date().getFullYear()} Vezhambal Luxury Resort. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
