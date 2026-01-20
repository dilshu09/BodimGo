import { useState } from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ onSearch }) => {
    const [city, setCity] = useState('');
    const [type, setType] = useState('');

    const handleSearch = () => {
        onSearch({ city, type });
    };

    return (
        <div className="bg-white rounded-full shadow-lg border border-neutral-200 p-2 max-w-4xl mx-auto flex items-center divide-x divide-neutral-200">
            <div className="px-6 py-2 flex-1 hover:bg-neutral-50 rounded-full transition-colors">
                <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-0.5">Location</label>
                <input
                    type="text"
                    placeholder="Where are you going?"
                    className="w-full bg-transparent border-none outline-none text-sm text-neutral-600 placeholder:text-neutral-400"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                />
            </div>

            <div className="px-6 py-2 flex-1 hover:bg-neutral-50 rounded-full transition-colors hidden md:block">
                <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-0.5">Type</label>
                <select
                    className="w-full bg-transparent border-none outline-none text-sm text-neutral-600 appearance-none bg-none"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                >
                    <option value="">Any Type</option>
                    <option value="entire_place">Entire Place</option>
                    <option value="private_room">Private Room</option>
                    <option value="shared_room">Shared Room</option>
                </select>
            </div>

            <div className="pl-6 pr-2 py-2">
                <button
                    onClick={handleSearch}
                    className="bg-primary hover:bg-[#FF385C]/90 text-white rounded-full p-4 flex items-center gap-2 font-bold transition-transform active:scale-95"
                >
                    <Search size={20} strokeWidth={2.5} />
                    <span className="hidden lg:inline">Search</span>
                </button>
            </div>
        </div>
    );
};

export default SearchBar;
