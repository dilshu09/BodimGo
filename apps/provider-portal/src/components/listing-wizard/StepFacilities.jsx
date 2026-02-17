import {
    Wifi, Bath, Utensils, Wind, Fan, Calculator,
    Droplets, Tv, Video, Car, Bike, BookOpen,
    Columns, Flower2, Dumbbell, Waves, Zap, Sparkles, Plus
} from 'lucide-react';

// Enhanced Facility List with Icons
const FACILITIES = [
    { label: "Attached Bathroom", icon: Bath },
    { label: "Private Kitchen", icon: Utensils },
    { label: "Air Conditioning", icon: Wind },
    { label: "Ceiling Fan", icon: Fan },
    { label: "Hot Water", icon: Droplets },
    { label: "Washing Machine", icon: Waves }, // Reusing Waves as abstraction or use a custom one 
    { label: "Refrigerator", icon: Zap }, // Abstract
    { label: "Microwave", icon: Calculator }, // Abstract
    { label: "Wi-Fi", icon: Wifi },
    { label: "CCTV Security", icon: Video },
    { label: "Parking (Car)", icon: Car },
    { label: "Parking (Bike)", icon: Bike },
    { label: "Study Table", icon: BookOpen },
    { label: "Wardrobe", icon: Columns },
    { label: "Balcony", icon: Wind },
    { label: "Garden", icon: Flower2 },
    { label: "Gym Access", icon: Dumbbell },
    { label: "Swimming Pool", icon: Waves },
    { label: "Generator/Solar", icon: Zap },
    { label: "Cleaner Service", icon: Sparkles }
];

const StepFacilities = ({ data, update }) => {
    const toggleFacility = (facilityLabel) => {
        const current = data.facilities || [];
        const updated = current.includes(facilityLabel)
            ? current.filter(f => f !== facilityLabel)
            : [...current, facilityLabel];
        update({ facilities: updated });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-neutral-800 dark:text-white">What does your place offer?</h3>
                <p className="text-neutral-500 dark:text-slate-400 text-sm">Select all the amenities available for tenants.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {FACILITIES.map(({ label, icon: Icon }) => {
                    const isSelected = data.facilities?.includes(label);
                    return (
                        <div
                            key={label}
                            onClick={() => toggleFacility(label)}
                            className={`
                                cursor-pointer relative group rounded-2xl p-4 border-2 transition-all duration-300 flex flex-col items-center justify-center text-center gap-3 min-h-[120px]
                                ${isSelected
                                    ? 'border-primary bg-primary/5 dark:bg-primary/20 shadow-md scale-[1.02]'
                                    : 'border-transparent bg-white dark:bg-slate-800 shadow-sm hover:shadow-md hover:bg-neutral-50 dark:hover:bg-slate-700'}
                            `}
                        >
                            <div className={`p-3 rounded-full transition-colors ${isSelected ? 'bg-primary text-white' : 'bg-neutral-100 dark:bg-slate-700 text-neutral-500 dark:text-slate-400 group-hover:bg-neutral-200 dark:group-hover:bg-slate-600'}`}>
                                <Icon size={24} />
                            </div>
                            <span className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-neutral-600 dark:text-slate-300'}`}>{label}</span>

                            {isSelected && (
                                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary animate-pulse" />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Custom Facility Input */}
            <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-slate-800">
                <h4 className="font-bold text-neutral-800 dark:text-white mb-2">Other Amenities</h4>
                <div className="flex gap-2">
                    <input
                        type="text"
                        id="custom-facility-input"
                        placeholder="e.g. Roof Top, Solar Power, Gym"
                        className="input-field flex-1 border-neutral-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-primary focus:ring-primary"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = e.target.value.trim();
                                if (val && !data.facilities?.includes(val)) {
                                    toggleFacility(val); // Reuse toggle to add
                                    e.target.value = '';
                                }
                            }
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => {
                            const input = document.getElementById('custom-facility-input');
                            const val = input.value.trim();
                            if (val && !data.facilities?.includes(val)) {
                                toggleFacility(val);
                                input.value = '';
                            }
                        }}
                        className="bg-neutral-900 text-white px-6 rounded-xl font-bold hover:bg-neutral-800 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-neutral-200"
                    >
                        <Plus size={20} />
                        Add
                    </button>
                </div>

                {/* Display Custom Added Facilities (Not in Predefined List) */}
                <div className="flex flex-wrap gap-2 mt-4">
                    {data.facilities?.filter(f => !FACILITIES.some(pf => pf.label === f)).map(custom => (
                        <div key={custom} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                            {custom}
                            <button
                                onClick={() => toggleFacility(custom)}
                                className="hover:text-red-500 transition-colors"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-8 p-5 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-100 flex items-start gap-4">
                <span className="text-2xl mt-1">💡</span>
                <div>
                    <h4 className="font-bold text-yellow-800 text-sm">Pro Tip</h4>
                    <p className="text-yellow-700 text-sm mt-1">
                        Properties with 5+ amenities designated are ranked 40% higher in search.
                        Don't forget to mark <strong>Attached Bathroom</strong> if available!
                    </p>
                </div>
            </div>
        </div>
    );
};
export default StepFacilities;
