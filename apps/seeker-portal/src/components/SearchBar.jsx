import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const SearchBar = ({ onSearch }) => {
    // Search State
    const [search, setSearch] = useState('');

    // Filters State
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        type: '',
        gender: '',
        minPrice: '',
        maxPrice: ''
    });

    const handleSearch = () => {
        onSearch({
            search,
            ...filters
        });
        setShowFilters(false);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            type: '',
            gender: '',
            minPrice: '',
            maxPrice: ''
        });
    };

    return (
        <div className="relative max-w-4xl mx-auto">
            {/* Main Search Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-full shadow-lg border border-neutral-200 dark:border-slate-800 p-2 flex items-center hover:border-[#FF385C] dark:hover:border-[#FF385C] transition-colors duration-300">
                <div className="flex-1 px-6 py-2 hover:bg-neutral-50 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <label className="block text-xs font-bold text-neutral-800 dark:text-slate-200 uppercase tracking-wider mb-0.5">
                        Location or Name
                    </label>
                    <input
                        type="text"
                        placeholder="Search by City or Property Name"
                        className="w-full bg-transparent border-none outline-none text-sm text-neutral-600 dark:text-slate-300 placeholder:text-neutral-400 dark:placeholder:text-slate-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>

                <div className="flex items-center gap-2 pr-2">
                    {/* Filters Trigger */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-3 rounded-full hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors border border-neutral-200 dark:border-slate-700
                            ${(filters.type || filters.gender || filters.minPrice || filters.maxPrice) ? 'bg-neutral-100 dark:bg-slate-800 border-black dark:border-slate-500' : ''}`}
                    >
                        <SlidersHorizontal size={20} className="text-neutral-700 dark:text-slate-300" />
                    </button>

                    {/* Search Button */}
                    <button
                        onClick={handleSearch}
                        className="bg-primary hover:bg-[#FF385C]/90 text-white rounded-full p-4 flex items-center gap-2 font-bold transition-transform active:scale-95 shadow-md"
                    >
                        <Search size={20} strokeWidth={2.5} />
                        <span className="hidden lg:inline">Search</span>
                    </button>
                </div>
            </div>

            {/* Filters Modal/Dropdown */}
            {showFilters && (
                <div className="absolute top-20 left-0 right-0 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-slate-800 p-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Filters</h3>
                        <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-full text-neutral-600 dark:text-slate-400">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Price Range */}
                        <div>
                            <label className="block text-sm font-bold text-neutral-700 dark:text-slate-300 mb-3">Price Range (Rs)</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    className="w-full p-3 border border-neutral-300 dark:border-slate-700 rounded-xl focus:border-black dark:focus:border-slate-500 outline-none bg-white dark:bg-slate-950 text-neutral-900 dark:text-slate-200"
                                    value={filters.minPrice}
                                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                                />
                                <span className="text-neutral-400">-</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    className="w-full p-3 border border-neutral-300 dark:border-slate-700 rounded-xl focus:border-black dark:focus:border-slate-500 outline-none bg-white dark:bg-slate-950 text-neutral-900 dark:text-slate-200"
                                    value={filters.maxPrice}
                                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Gender Preference */}
                        <div>
                            <label className="block text-sm font-bold text-neutral-700 dark:text-slate-300 mb-3">Gender</label>
                            <div className="flex flex-wrap gap-2">
                                {['Girls only', 'Boys only', 'Mixed'].map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => handleFilterChange('gender', filters.gender === opt ? '' : opt)}
                                        className={`px-4 py-2 rounded-full border text-sm font-medium transition-all
                                            ${filters.gender === opt
                                                ? 'bg-black dark:bg-slate-200 text-white dark:text-slate-900 border-black dark:border-slate-200'
                                                : 'bg-white dark:bg-slate-950 text-neutral-600 dark:text-slate-400 border-neutral-300 dark:border-slate-700 hover:border-black dark:hover:border-slate-500'}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Property Type */}
                        <div>
                            <label className="block text-sm font-bold text-neutral-700 dark:text-slate-300 mb-3">Property Type</label>
                            <div className="flex flex-wrap gap-2">
                                {['Annex', 'Single Room', 'House', 'Shared House', 'Apartment', 'Hostel'].map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => handleFilterChange('type', filters.type === opt ? '' : opt)}
                                        className={`px-4 py-2 rounded-full border text-sm font-medium transition-all
                                            ${filters.type === opt
                                                ? 'bg-black dark:bg-slate-200 text-white dark:text-slate-900 border-black dark:border-slate-200'
                                                : 'bg-white dark:bg-slate-950 text-neutral-600 dark:text-slate-400 border-neutral-300 dark:border-slate-700 hover:border-black dark:hover:border-slate-500'}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-neutral-100 dark:border-slate-800 mt-6 pt-6 flex justify-between items-center">
                        <button onClick={clearFilters} className="text-sm font-bold text-neutral-500 dark:text-slate-500 hover:text-black dark:hover:text-slate-300 underline">
                            Clear all
                        </button>
                        <button
                            onClick={handleSearch}
                            className="bg-black dark:bg-slate-200 text-white dark:text-slate-900 px-8 py-3 rounded-xl font-bold hover:bg-neutral-800 dark:hover:bg-white transition-transform active:scale-95"
                        >
                            Show Results
                        </button>
                    </div>
                </div>
            )}

            {/* Backdrop */}
            {showFilters && (
                <div className="fixed inset-0 bg-black/5 z-40" onClick={() => setShowFilters(false)} />
            )}
        </div>
    );
};

export default SearchBar;
