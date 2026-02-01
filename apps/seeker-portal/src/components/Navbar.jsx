import { Link } from 'react-router-dom';
import { Search, UserCircle, Globe } from 'lucide-react';
import logo from '../assets/logo.png';

const Navbar = () => {
    return (
        <nav className="border-b border-neutral-200 bg-white sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2">
                    <img src={logo} alt="BodimGo" className="h-8 w-auto" />
                    <span className="text-primary font-bold text-2xl">BodimGo</span>
                </Link>

                {/* Search Bar Placeholder (Short version for Navbar) */}
                <div className="hidden md:flex items-center border border-neutral-300 rounded-full py-2.5 px-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <div className="px-4 font-medium text-sm text-neutral-800 border-r border-neutral-300">Anywhere</div>
                    <div className="px-4 font-medium text-sm text-neutral-800 border-r border-neutral-300">Any week</div>
                    <div className="px-4 text-sm text-neutral-500">Add guests</div>
                    <div className="bg-primary p-2 rounded-full text-white ml-2">
                        <Search size={14} strokeWidth={3} />
                    </div>
                </div>

                {/* Right Menu */}
                <div className="flex items-center gap-4">
                    <a href="http://localhost:5175" className="text-sm font-medium hover:bg-neutral-100 px-4 py-2 rounded-full transition-colors hidden md:block">
                        Switch to Hosting
                    </a>
                    <button className="hover:bg-neutral-100 p-2 rounded-full hidden md:block">
                        <Globe size={18} />
                    </button>

                    <div className="group relative">
                        <div className="flex items-center gap-2 border border-neutral-300 rounded-full p-1 pl-3 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="h-4 w-4 flex flex-col justify-between py-1">
                                <span className="block w-full h-[2px] bg-neutral-600"></span>
                                <span className="block w-full h-[2px] bg-neutral-600"></span>
                                <span className="block w-full h-[2px] bg-neutral-600"></span>
                            </div>
                            <UserCircle size={30} className="text-neutral-500" />
                        </div>

                        {/* Dropdown */}
                        <div className="absolute right-0 top-12 w-60 bg-white rounded-xl shadow-xl border border-neutral-100 overflow-hidden hidden group-hover:block transition-all z-50">
                            <div className="py-2 border-b border-neutral-100">
                                <Link to="/register" className="block px-4 py-3 font-bold text-neutral-800 hover:bg-neutral-50">Sign up</Link>
                                <Link to="/login" className="block px-4 py-3 text-neutral-600 hover:bg-neutral-50">Log in</Link>
                            </div>
                            <div className="py-2 border-b border-neutral-100">
                                <Link to="/wishlist" className="block px-4 py-3 text-neutral-800 hover:bg-neutral-50 font-semibold">
                                    Wishlist <span className="text-primary">❤️</span>
                                </Link>
                            </div>
                            <div className="py-2">
                                <a href="http://localhost:5175" className="block px-4 py-3 text-neutral-600 hover:bg-neutral-50">Host your home</a>
                                <Link to="#" className="block px-4 py-3 text-neutral-600 hover:bg-neutral-50">Help Center</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
