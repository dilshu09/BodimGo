import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X, Home, Users, Check, Banknote, ChevronLeft, ChevronRight } from 'lucide-react';

const AdvancedSearchSidebar = ({ onSearch, isOpen, setIsOpen, isDesktopExpanded, setIsDesktopExpanded, initialFilters }) => {
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        type: [],
        gender: '',
        minPrice: '',
        maxPrice: '',
        facilities: [],
        sortBy: 'newest'
    });

    useEffect(() => {
        if (initialFilters) {
            setFilters(prev => ({ ...prev, ...initialFilters }));
        }
    }, [initialFilters]);

    const propertyTypes = ['Annex', 'Single Room', 'House', 'Shared House', 'Apartment', 'Hostel'];
    const facilitiesList = [
        'Air Conditioning', 
        'Wi-Fi', 
        'Attached Bathroom', 
        'Private Kitchen', 
        'Washing Machine', 
        'Parking (Car)', 
        'Parking (Bike)',
        'CCTV Security',
        'Hot Water',
        'Ceiling Fan'
    ];
    const genders = ['Girls only', 'Boys only', 'Mixed'];

    const handleApply = () => {
        onSearch({
            search,
            ...filters,
            type: filters.type.join(','),
            facilities: filters.facilities.join(',')
        });
        setIsOpen(false);
    };

    const clearFilters = () => {
        setSearch('');
        setFilters({
            type: [],
            gender: '',
            minPrice: '',
            maxPrice: '',
            facilities: [],
            sortBy: 'newest'
        });
        onSearch({ search: '' });
        setIsOpen(false);
    };

    const toggleType = (t) => {
        setFilters(prev => ({
            ...prev,
            type: prev.type.includes(t) ? prev.type.filter(item => item !== t) : [...prev.type, t]
        }));
    };

    const toggleFacility = (f) => {
        setFilters(prev => ({
            ...prev,
            facilities: prev.facilities.includes(f) ? prev.facilities.filter(item => item !== f) : [...prev.facilities, f]
        }));
    };

    const renderSidebarContent = () => (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 shadow-xl border-r border-neutral-200 dark:border-slate-800">
            {/* Header (Mobile Only) */}
            <div className="flex lg:hidden items-center justify-between p-4 border-b border-neutral-200 dark:border-slate-800">
                <h2 className="text-lg font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
                    <SlidersHorizontal size={20} className="text-[#FF385C]" />
                    Filters
                </h2>
                <button onClick={() => setIsOpen(false)} className="p-2 bg-neutral-100 dark:bg-slate-800 rounded-full text-neutral-600 dark:text-slate-300">
                    <X size={20} />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                {/* Search */}
                <div>
                    <label className="block text-sm font-bold text-neutral-800 dark:text-slate-200 uppercase tracking-wider mb-3">
                        Location or Name
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="e.g. Colombo, Malabe..."
                            className="w-full pl-10 pr-4 py-3 bg-neutral-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#FF385C] dark:focus:ring-[#FF385C] outline-none transition-all dark:text-white"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                        />
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-slate-400" />
                    </div>
                </div>

                {/* Price Range */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-neutral-800 dark:text-slate-200 uppercase tracking-wider mb-3">
                        <Banknote size={16} /> Price Range (LKR)
                    </label>
                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            placeholder="Min"
                            className="w-full p-3 bg-neutral-50 dark:bg-slate-800/50 border border-neutral-200 dark:border-slate-700 rounded-xl focus:border-black dark:focus:border-slate-500 outline-none text-neutral-900 dark:text-slate-200"
                            value={filters.minPrice}
                            onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                        />
                        <span className="text-neutral-400">-</span>
                        <input
                            type="number"
                            placeholder="Max"
                            className="w-full p-3 bg-neutral-50 dark:bg-slate-800/50 border border-neutral-200 dark:border-slate-700 rounded-xl focus:border-black dark:focus:border-slate-500 outline-none text-neutral-900 dark:text-slate-200"
                            value={filters.maxPrice}
                            onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                        />
                    </div>
                </div>

                {/* Sort By */}
                <div>
                    <label className="block text-sm font-bold text-neutral-800 dark:text-slate-200 uppercase tracking-wider mb-3">
                        Sort By
                    </label>
                    <div className="flex flex-col gap-4">
                        <select
                            value={filters.sortBy}
                            onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                            className="w-full p-3 bg-neutral-50 dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-xl focus:border-black dark:focus:border-slate-500 outline-none text-neutral-900 dark:text-slate-200"
                        >
                            <option value="newest">Recommended & Newest</option>
                            <option value="rating">Highest Rated</option>
                            <option value="available">Available First</option>
                        </select>
                    </div>
                </div>

                {/* Gender */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-neutral-800 dark:text-slate-200 uppercase tracking-wider mb-3">
                        <Users size={16} /> Gender
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {genders.map(opt => (
                            <button
                                key={opt}
                                onClick={() => setFilters(prev => ({ ...prev, gender: prev.gender === opt ? '' : opt }))}
                                className={`p-2 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-2
                                    ${filters.gender === opt
                                        ? 'bg-[#FF385C]/10 border-[#FF385C] text-[#FF385C]'
                                        : 'bg-transparent border-neutral-200 dark:border-slate-700 text-neutral-600 dark:text-slate-400 hover:border-black dark:hover:border-slate-500'}`}
                            >
                                {filters.gender === opt && <Check size={14} />}
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Property Type */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-neutral-800 dark:text-slate-200 uppercase tracking-wider mb-3">
                        <Home size={16} /> Property Type
                    </label>
                    <div className="flex flex-col gap-3">
                        {propertyTypes.map(opt => (
                            <label key={opt} className="flex items-center gap-3 cursor-pointer group" onClick={(e) => { e.preventDefault(); toggleType(opt); }}>
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors
                                    ${filters.type.includes(opt) ? 'bg-[#FF385C] border-[#FF385C]' : 'border-neutral-300 dark:border-slate-600 group-hover:border-[#FF385C]'}`}>
                                    {filters.type.includes(opt) && <Check size={14} className="text-white" />}
                                </div>
                                <span className="text-sm text-neutral-700 dark:text-slate-300">{opt}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Facilities */}
                <div>
                    <label className="block text-sm font-bold text-neutral-800 dark:text-slate-200 uppercase tracking-wider mb-3">
                        Facilities
                    </label>
                    <div className="flex flex-col gap-3">
                        {facilitiesList.map(opt => (
                            <label key={opt} className="flex items-center gap-3 cursor-pointer group" onClick={(e) => { e.preventDefault(); toggleFacility(opt); }}>
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors
                                    ${filters.facilities.includes(opt) ? 'bg-[#FF385C] border-[#FF385C]' : 'border-neutral-300 dark:border-slate-600 group-hover:border-[#FF385C]'}`}>
                                    {filters.facilities.includes(opt) && <Check size={14} className="text-white" />}
                                </div>
                                <span className="text-sm text-neutral-700 dark:text-slate-300">{opt}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-2 gap-3">
                <button
                    onClick={clearFilters}
                    className="py-3 px-4 rounded-xl font-bold text-neutral-700 dark:text-slate-300 bg-neutral-100 dark:bg-slate-800 hover:bg-neutral-200 dark:hover:bg-slate-700 transition-colors"
                >
                    Clear All
                </button>
                <button
                    onClick={handleApply}
                    className="py-3 px-4 rounded-xl font-bold text-white bg-[#FF385C] hover:bg-[#FF385C]/90 transition-colors shadow-lg shadow-[#FF385C]/20 flex items-center justify-center gap-2"
                >
                    <Search size={18} /> Apply
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar (Sticky) */}
            <div className={`hidden lg:block flex-shrink-0 h-[calc(100vh-80px)] sticky top-20 z-10 transition-all duration-300 relative ${isDesktopExpanded ? 'w-[300px] xl:w-[320px]' : 'w-[60px]'}`}>
                {/* Toggle Button */}
                <button 
                    onClick={() => setIsDesktopExpanded(!isDesktopExpanded)}
                    className="absolute -right-4 top-8 w-8 h-8 bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transition-all z-20 text-neutral-600 dark:text-slate-300"
                    title={isDesktopExpanded ? "Collapse Filters" : "Expand Filters"}
                >
                    {isDesktopExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                </button>

                {isDesktopExpanded ? (
                    <div className="h-full pr-1">
                        {renderSidebarContent()}
                    </div>
                ) : (
                    <div className="flex flex-col h-full bg-white dark:bg-slate-900 shadow-xl border-r border-neutral-200 dark:border-slate-800 items-center py-8 rounded-tr-xl pr-1">
                        <div className="text-neutral-400 dark:text-slate-500 tracking-widest uppercase text-sm font-bold flex items-center justify-center h-full" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                            Filters
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Drawer */}
            {isOpen && (
                <div className="fixed inset-0 z-50 lg:hidden flex">
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
                    
                    {/* Drawer */}
                    <div className="relative w-[85%] max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl animate-in slide-in-from-left duration-300">
                        {renderSidebarContent()}
                    </div>
                </div>
            )}
        </>
    );
};

export default AdvancedSearchSidebar;
