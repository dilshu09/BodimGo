import { GoogleMap, Marker } from '@react-google-maps/api';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { MapPin, AlertCircle, CheckCircle2, Loader2, Search, ChevronDown } from 'lucide-react';
import { PROVINCES, PROVINCE_DISTRICTS, DISTRICT_CITIES } from '../../data/locations';

const mapContainerStyle = { width: '100%', height: '100%', borderRadius: '12px' };
const defaultCenter = { lat: 6.9271, lng: 79.8612 }; // Colombo Default

const StepLocation = ({ data, update, errors, verified, isMapsLoaded }) => {
    // City Search State
    const [citySearch, setCitySearch] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const mapCenter = useMemo(() => {
        return data.location?.coordinates?.lat ? data.location.coordinates : defaultCenter;
    }, [data.location?.coordinates]);

    // Derive Province
    const [province, setProvince] = useState('');

    useEffect(() => {
        if (data.location?.district && !province) {
            const found = Object.keys(PROVINCE_DISTRICTS).find(p => PROVINCE_DISTRICTS[p].includes(data.location.district));
            if (found) setProvince(found);
        }
    }, [data.location?.district]);

    // Update city search text when data changes externally
    useEffect(() => {
        if (data.location?.city) {
            setCitySearch(data.location.city);
        }
    }, [data.location?.city]);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'province') {
            setProvince(value);
            update({
                location: { ...data.location, district: '', city: '' }
            });
            setCitySearch('');
        } else if (name === 'district') {
            update({
                location: { ...data.location, district: value, city: '' }
            });
            setCitySearch('');
        } else {
            update({
                location: { ...data.location, [name]: value }
            });
        }
    };

    // City Selection Logic
    const availableDistricts = province ? PROVINCE_DISTRICTS[province] : [];
    const availableCities = data.location?.district ? DISTRICT_CITIES[data.location.district] : [];

    const filteredCities = availableCities.filter(city =>
        city.toLowerCase().includes(citySearch.toLowerCase())
    );

    const handleCitySelect = (city) => {
        update({
            location: { ...data.location, city: city }
        });
        setCitySearch(city);
        setIsDropdownOpen(false);
    };

    const handleMapClick = useCallback((e) => {
        update({
            location: {
                ...data.location,
                coordinates: { lat: e.latLng.lat(), lng: e.latLng.lng() }
            }
        });
    }, [data.location, update]);

    return (
        <div className="space-y-6 animate-fade-in">
            {verified && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2 mb-6">
                    <CheckCircle2 size={20} />
                    <span className="font-semibold">Address Verified! Coordinates match the location.</span>
                </div>
            )}
            {errors?.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 mb-6">
                    <AlertCircle size={20} />
                    <span className="font-semibold">{errors.general}</span>
                </div>
            )}

            <h3 className="font-bold text-xl text-neutral-800">Property Location</h3>
            <p className="text-neutral-500 text-sm -mt-4">Where is your property located?</p>

            {/* 3-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-20">
                <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-2">Province</label>
                    <select
                        name="province"
                        value={province}
                        onChange={handleChange}
                        className={`input-field ${errors?.hierarchy ? 'border-red-500' : ''}`}
                    >
                        <option value="">Select Province</option>
                        {PROVINCES.map(prov => (
                            <option key={prov} value={prov}>{prov}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-2">District</label>
                    <select
                        name="district"
                        value={data.location?.district}
                        onChange={handleChange}
                        className="input-field"
                        disabled={!province}
                    >
                        <option value="">Select District</option>
                        {availableDistricts.map(dist => (
                            <option key={dist} value={dist}>{dist}</option>
                        ))}
                    </select>
                </div>

                {/* Custom City Autocomplete */}
                <div ref={dropdownRef} className="relative">
                    <label className="block text-sm font-bold text-neutral-700 mb-2">City/Town</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={citySearch}
                            onChange={(e) => {
                                const val = e.target.value;
                                setCitySearch(val);
                                update({ location: { ...data.location, city: val } }); // Fix: Sync to parent
                                setIsDropdownOpen(true);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            className="input-field pr-10"
                            placeholder={data.location?.district ? "Search City..." : "Select District First"}
                            disabled={!data.location?.district}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                            {isDropdownOpen ? <Search size={16} /> : <ChevronDown size={16} />}
                        </div>
                    </div>

                    {/* Dropdown List */}
                    {isDropdownOpen && data.location?.district && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg max-h-60 overflow-y-auto z-50">
                            {filteredCities.length > 0 ? (
                                filteredCities.map(city => (
                                    <button
                                        key={city}
                                        onClick={() => handleCitySelect(city)}
                                        className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-sm text-neutral-700 transition-colors flex items-center justify-between"
                                    >
                                        {city}
                                        {data.location?.city === city && <CheckCircle2 size={14} className="text-primary" />}
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-3 text-sm text-neutral-400 text-center">
                                    No cities found matching "{citySearch}"
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {errors?.hierarchy && <p className="text-red-500 text-xs font-medium">{errors.hierarchy}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 z-10 relative">
                <div className="col-span-2">
                    <label className="block text-sm font-bold text-neutral-700 mb-2">Full Address</label>
                    <input
                        type="text"
                        name="address"
                        value={data.location?.address}
                        onChange={handleChange}
                        className={`input-field ${errors?.addressText ? 'border-red-500' : ''}`}
                        placeholder="House No, Street, Landmark"
                    />
                    {errors?.addressText && <p className="text-red-500 text-xs mt-1">{errors.addressText}</p>}
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-bold text-neutral-700 mb-2 flex items-center gap-2">
                        <MapPin size={16} /> Pin Location on Map
                    </label>
                    <div className={`h-80 bg-neutral-100 rounded-xl border overflow-hidden relative ${errors?.coordinates ? 'border-red-500 ring-2 ring-red-100' : 'border-neutral-200'}`}>
                        {!isMapsLoaded ? (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                <Loader2 className="animate-spin" /> Loading Maps...
                            </div>
                        ) : (
                            <GoogleMap
                                mapContainerStyle={mapContainerStyle}
                                zoom={14}
                                center={mapCenter}
                                onClick={handleMapClick}
                                options={{ streetViewControl: false, mapTypeControl: false }}
                            >
                                <Marker
                                    position={mapCenter}
                                    draggable={true}
                                    onDragEnd={handleMapClick}
                                />
                            </GoogleMap>
                        )}

                        {(!data.location?.coordinates?.lat || data.location?.coordinates?.lat === 0) && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 px-4 py-2 rounded-full shadow-lg text-xs font-bold text-primary pointer-events-none z-10">
                                Tap map to update pin
                            </div>
                        )}
                        {errors?.coordinates && (
                            <div className="absolute bottom-4 left-4 right-4 bg-red-50 border border-red-200 p-2 rounded-lg text-red-600 text-xs font-medium z-10 text-center bg-white shadow-md">
                                <AlertCircle size={14} className="inline mr-1" />
                                {errors.coordinates}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default StepLocation;
