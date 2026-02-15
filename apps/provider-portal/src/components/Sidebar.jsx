import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    LayoutDashboard,
    FileText,
    BedDouble,
    MessageSquare,
    UserPlus,
    Users,
    DollarSign,
    Wrench,
    Star,
    Settings,
    ChevronDown,
    ChevronRight,

    LogOut,
    HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.png';

const SidebarItem = ({ item, isExpanded, onToggle, isActive }) => {
    const hasSubItems = item.subItems && item.subItems.length > 0;

    return (
        <div className="mb-1">
            <div
                onClick={() => hasSubItems && onToggle(item.id)}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer rounded-xl transition-colors
                    ${isActive && !hasSubItems ? 'bg-primary/10 text-primary font-medium' : 'text-neutral-600 dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-800 hover:text-neutral-900 dark:hover:text-slate-200'}
                `}
            >
                {/* Main Link Content */}
                {hasSubItems ? (
                    <div className="flex items-center gap-3">
                        <item.icon size={20} />
                        <span className="text-sm">{item.label}</span>
                    </div>
                ) : (
                    <NavLink to={item.path} className="flex items-center gap-3 w-full">
                        <item.icon size={20} />
                        <span className="text-sm">{item.label}</span>
                    </NavLink>
                )}

                {/* Arrow for Accordion */}
                {hasSubItems && (
                    <div className="text-neutral-400 dark:text-slate-500">
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                )}
            </div>

            {/* Sub Items */}
            <AnimatePresence>
                {hasSubItems && isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden ml-4 pl-4 border-l border-neutral-200 dark:border-slate-800"
                    >
                        {item.subItems.map((sub) => (
                            <NavLink
                                key={sub.path}
                                to={sub.path}
                                className={({ isActive }) => `block py-2 text-sm transition-colors ${isActive ? 'text-primary font-medium' : 'text-neutral-500 dark:text-slate-500 hover:text-neutral-800 dark:hover:text-slate-300'}`}
                            >
                                {sub.label}
                            </NavLink>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Sidebar = () => {
    // ... (logic remains the same)
    const location = useLocation();
    const navigate = useNavigate();

    // Config
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/auth/profile');
                setProfile(res.data);
            } catch (error) {
                console.error("Failed to fetch profile for sidebar customization", error);
            }
        };
        fetchProfile();
    }, []);

    // Config
    const baseSections = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        {
            id: 'listings',
            label: 'Listings',
            icon: FileText,
            subItems: [
                { label: 'My Listings', path: '/listings' },
                { label: 'Create Listing', path: '/add-listing' },

                { label: 'Agreements', path: '/agreements' }
            ]
        },
        {
            id: 'rooms',
            label: 'Rooms & Beds',
            icon: BedDouble,
            subItems: [
                { label: 'All Units', path: '/rooms' },
                { label: 'Availability', path: '/rooms/availability' },
                { label: 'Maintenance', path: '/rooms/maintenance' }
            ]
        },
        {
            id: 'inquiries',
            label: 'Inquiries',
            icon: MessageSquare,
            subItems: [
                { label: 'Inbox', path: '/messages' },
                { label: 'Bookings', path: '/bookings' },
                { label: 'Viewings', path: '/viewings' }
            ]
        },
        {
            id: 'onboarding',
            label: 'Onboarding',
            icon: UserPlus,
            subItems: [
                { label: 'Pending Approvals', path: '/approvals' },
                { label: 'Agreements', path: '/agreements' },
                { label: 'Manual Add', path: '/tenants/add' }
            ]
        },
        {
            id: 'tenants',
            label: 'Tenants',
            icon: Users,
            subItems: [
                { label: 'Active Tenants', path: '/tenants' },
                { label: 'Move History', path: '/tenants/history' }
            ]
        },
        {
            id: 'finance',
            label: 'Finance',
            icon: DollarSign,
            subItems: [
                { label: 'Dashboard', path: '/finance' },
                { label: 'Invoices', path: '/finance/invoices' },
                { label: 'Payments', path: '/finance/payments' },
                { label: 'Reports', path: '/finance/reports' }
            ]
        },
        { id: 'reviews', label: 'Reviews', icon: Star, path: '/reviews' },
        { id: 'support', label: 'Help & Support', icon: HelpCircle, path: '/support' },
        { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
    ];

    const sections = baseSections.map(section => {
        if (section.id === 'onboarding' && profile?.stripeOnboardingComplete) {
            return {
                ...section,
                subItems: section.subItems.filter(item => item.label !== 'Pending Approvals')
            };
        }
        return section;
    });

    const [expandedSections, setExpandedSections] = useState({
        listings: true, // Default open
        onboarding: false,
        finance: false
    });

    const toggleSection = (id) => {
        setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleLogout = async () => {
        try {
            // Call backend to clear cookie
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Redirect to login
            navigate('/login');
        }
    };

    return (
        <div className="w-64 h-screen bg-white dark:bg-slate-900 border-r border-neutral-200 dark:border-slate-800 flex flex-col sticky top-0 transition-colors duration-200">
            {/* Logo */}
            <div className="p-6 border-b border-neutral-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <img src={logo} alt="BodimGo" className="h-8 w-auto" />
                    <div>
                        <h1 className="text-xl font-bold text-primary leading-tight">BodimGo</h1>
                        <p className="text-[10px] text-neutral-400 dark:text-slate-500 font-bold tracking-wider uppercase">Provider Portal</p>
                    </div>
                </div>
            </div>

            {/* Menu */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {sections.map(section => (
                    <SidebarItem
                        key={section.id}
                        item={section}
                        isExpanded={expandedSections[section.id]}
                        onToggle={toggleSection}
                        isActive={location.pathname === section.path || (section.subItems && section.subItems.some(sub => location.pathname === sub.path))}
                    />
                ))}
            </div>

            {/* User Profile / Logout */}
            <div className="p-4 border-t border-neutral-100 dark:border-slate-800">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
                >
                    <LogOut size={20} />
                    <span className="text-sm font-medium">Log Out</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
