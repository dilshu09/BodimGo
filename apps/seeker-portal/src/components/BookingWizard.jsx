import React, { useState } from 'react';
import { Calendar, CheckCircle, ArrowRight, ArrowLeft, User, Bed, X, ChevronRight, Check } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const BookingWizard = ({ listing, onClose, onSuccess, user }) => {
    // Determine if we need room selection
    const hasRooms = listing.rooms && listing.rooms.length > 0;

    const [step, setStep] = useState(hasRooms ? 1 : 2); // Start at 1 if rooms, else skip to details (simulating step 2 as 1st visible)
    // Actually, let's keep step logic simple: 
    // Step 1: Room Selection (Only if hasRooms)
    // Step 2: Personal Details
    // Step 3: Agreement
    // Step 4: Confirm

    // Normalizing steps:
    // If hasRooms: 1=Room, 2=Details, 3=Agreement, 4=Confirm
    // If noRooms:  1=Details, 2=Agreement, 3=Confirm

    // Better Approach: Use explicit step names or just conditional rendering based on a counter that accounts for the offset.
    // Let's stick to a counter but adjust "Display Step" and "Total Steps" dynamically.

    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    // Steps Array
    const steps = [
        ...(hasRooms ? [{ id: 'room', title: 'Select Room' }] : []),
        { id: 'details', title: 'Personal Details' },
        { id: 'agreement', title: 'House Rules' },
        { id: 'confirm', title: 'Confirm' }
    ];

    const currentStep = steps[currentStepIndex];
    const totalSteps = steps.length;

    const [loading, setLoading] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        nic: '',
        occupation: 'Student',
        note: '',
        phone: user?.phone || '',
        address: user?.address || '',
        gender: '',
        agreementAccepted: false,
        organization: '',
        faculty: '',
        workplace: '',
        otherDescription: ''
    });

    const validateDetails = () => {
        if (!formData.name.trim()) return "Full Name is required";
        if (!formData.gender) return "Gender is required";
        if (!formData.phone.trim()) return "Phone Number is required";
        if (!formData.address.trim()) return "Address is required";

        if (formData.occupation === 'Student') {
            if (!formData.organization.trim()) return "University/Institute is required";
            if (!formData.faculty.trim()) return "Faculty/Course is required";
        } else if (formData.occupation === 'Working Professional') {
            if (!formData.workplace.trim()) return "Workplace is required";
        } else if (formData.occupation === 'Other') {
            if (!formData.otherDescription.trim()) return "Please describe your occupation";
        }
        return null;
    };

    const handleNext = () => {
        if (currentStep.id === 'room') {
            if (!selectedRoom) {
                toast.error("Please select a room to proceed.");
                return;
            }
        }
        if (currentStep.id === 'details') {
            const error = validateDetails();
            if (error) {
                toast.error(error);
                return;
            }
        }
        if (currentStep.id === 'agreement' && !formData.agreementAccepted) {
            toast.error("You must accept the agreement to proceed.");
            return;
        }

        if (currentStepIndex < totalSteps - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => setCurrentStepIndex(prev => prev - 1);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Price is either from selected room OR listing rent
            const rent = selectedRoom ? selectedRoom.price : (listing.rent || 0);
            const deposit = selectedRoom ? (selectedRoom.deposit || listing.pricingDefaults?.deposit?.amount || 0) : (listing.deposit || 0);

            await api.post('/bookings', {
                listingId: listing._id,
                roomId: selectedRoom?._id, // Send Room ID
                startDate: new Date(),
                endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                applicationData: {
                    name: formData.name,
                    nic: formData.nic,
                    occupation: formData.occupation,
                    note: formData.note,
                    phone: formData.phone,
                    address: formData.address,
                    gender: formData.gender,
                    organization: formData.occupation === 'Student' ? formData.organization : undefined,
                    faculty: formData.occupation === 'Student' ? formData.faculty : undefined,
                    workplace: formData.occupation === 'Working Professional' ? formData.workplace : undefined,
                    otherDescription: formData.occupation === 'Other' ? formData.otherDescription : undefined,
                },
                agreementAccepted: formData.agreementAccepted
            });
            toast.success('Booking Request Sent!');
            onSuccess();
            onClose(); // Close the wizard modal (or ListingDetails logic handles this)
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || "Failed to send request.";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-transparent dark:border-slate-800">
                {/* Header */}
                <div className="px-6 py-4 border-b border-neutral-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10 transition-colors">
                    <div>
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Request to Book</h2>
                        <p className="text-sm text-neutral-500 dark:text-slate-400">Step {currentStepIndex + 1} of {totalSteps}: {currentStep.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-full text-neutral-500 dark:text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">

                    {/* STEP: ROOM SELECTION */}
                    {currentStep.id === 'room' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg mb-2">Select a Room</h3>
                            <div className="space-y-3">
                                {listing.rooms.filter(r => r.status === 'Available' || (r.availableBeds > 0)).map((room) => (
                                    <div
                                        key={room._id}
                                        onClick={() => setSelectedRoom(room)}
                                        className={`group border rounded-2xl p-4 cursor-pointer transition-all flex gap-4 items-start ${selectedRoom?._id === room._id
                                            ? 'border-[#E51D54] bg-[#E51D54]/5 dark:bg-[#E51D54]/10 ring-1 ring-[#E51D54]'
                                            : 'border-neutral-200 dark:border-slate-700 dark:hover:border-slate-600 hover:border-[#E51D54]/50 hover:shadow-md dark:hover:shadow-slate-900/50'
                                            }`}
                                    >
                                        {/* Room Image Thumb */}
                                        <div className="w-24 h-24 bg-neutral-200 dark:bg-slate-700 rounded-xl overflow-hidden flex-shrink-0 relative">
                                            {room.images?.[0] ? (
                                                <img src={typeof room.images[0] === 'string' ? room.images[0] : room.images[0].url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-neutral-400 dark:text-slate-500"><Bed size={24} /></div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-neutral-900 dark:text-white text-lg line-clamp-1">{room.name}</h4>
                                                <div className={`w-5 h-5 rounded-full border flex flex-shrink-0 items-center justify-center ml-2 ${selectedRoom?._id === room._id ? 'bg-[#E51D54] border-[#E51D54]' : 'border-neutral-300 dark:border-slate-600'}`}>
                                                    {selectedRoom?._id === room._id && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                                </div>
                                            </div>

                                            <div className="mb-2">
                                                <span className="font-bold text-[#E51D54] text-lg">Rs {room.price.toLocaleString()}</span>
                                                <span className="text-neutral-500 dark:text-slate-400 text-sm font-normal"> / month</span>
                                            </div>

                                            <div className="flex flex-wrap gap-2 text-xs">
                                                <span className="bg-neutral-100 dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 px-2 py-1 rounded-md text-neutral-600 dark:text-slate-300 flex items-center gap-1.5 font-medium">
                                                    <User size={12} /> {room.capacity} Person{room.capacity > 1 ? 's' : ''}
                                                </span>
                                                <span className="bg-neutral-100 dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 px-2 py-1 rounded-md text-neutral-600 dark:text-slate-300 font-medium capitalize">
                                                    {room.type}
                                                </span>
                                                {(room.availableBeds !== undefined && room.availableBeds !== null) ? (
                                                    <span className={`px-2 py-1 rounded-md border font-bold flex items-center gap-1 ${room.availableBeds > 0
                                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                                                        }`}>
                                                        {room.availableBeds > 0 ? (
                                                            <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {room.availableBeds} beds left</>
                                                        ) : 'Full'}
                                                    </span>
                                                ) : (
                                                    <span className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2 py-1 rounded-md font-bold">
                                                        Available
                                                    </span>
                                                )}
                                            </div>

                                            {room.features?.furnishing && room.features.furnishing.length > 0 && (
                                                <p className="text-xs text-neutral-400 dark:text-slate-500 mt-2 line-clamp-1">{room.features.furnishing.join(' • ')}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {listing.rooms.filter(r => r.status === 'Available' || (r.availableBeds > 0)).length === 0 && (
                                    <div className="text-center py-12 bg-neutral-50 dark:bg-slate-800 rounded-2xl border border-dashed border-neutral-300 dark:border-slate-700">
                                        <div className="w-12 h-12 bg-neutral-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3 text-neutral-400 dark:text-slate-500">
                                            <Bed size={24} />
                                        </div>
                                        <h3 className="text-neutral-900 dark:text-white font-medium">No rooms available</h3>
                                        <p className="text-sm text-neutral-500 dark:text-slate-400 mt-1">Please check back later or contact the provider.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP: DETAILS */}
                    {currentStep.id === 'details' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="font-bold text-lg">Tell the provider about yourself</h3>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300 mb-1">Full Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-neutral-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-[#E51D54] outline-none placeholder:text-neutral-400 dark:placeholder:text-slate-500"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter your full name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300 mb-1">Gender <span className="text-red-500">*</span></label>
                                <select
                                    className="w-full p-3 border border-neutral-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-[#E51D54] focus:border-transparent outline-none"
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                >
                                    <option value="" className="dark:bg-slate-800">Select Gender</option>
                                    <option value="Male" className="dark:bg-slate-800">Male</option>
                                    <option value="Female" className="dark:bg-slate-800">Female</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300 mb-1">Phone Number <span className="text-red-500">*</span></label>
                                <input
                                    type="tel"
                                    className="w-full p-3 border border-neutral-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-[#E51D54] outline-none placeholder:text-neutral-400 dark:placeholder:text-slate-500"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+94 7X XXX XXXX"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300 mb-1">Address <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-neutral-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-[#E51D54] outline-none placeholder:text-neutral-400 dark:placeholder:text-slate-500"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Your permanent address"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300 mb-1">Occupation <span className="text-red-500">*</span></label>
                                <select
                                    className="w-full p-3 border border-neutral-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-[#E51D54] focus:border-transparent outline-none"
                                    value={formData.occupation}
                                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                                >
                                    <option value="Student" className="dark:bg-slate-800">Student</option>
                                    <option value="Working Professional" className="dark:bg-slate-800">Working Professional</option>
                                    <option value="Other" className="dark:bg-slate-800">Other</option>
                                </select>
                            </div>

                            {/* Conditional Fields */}
                            {formData.occupation === 'Student' && (
                                <div className="pl-4 border-l-2 border-[#E51D54] space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300 mb-1">University / Institute <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            className="w-full p-3 border border-neutral-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-[#E51D54] outline-none placeholder:text-neutral-400 dark:placeholder:text-slate-500"
                                            value={formData.organization}
                                            onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                            placeholder="e.g. SLIIT, NSBM, UOM"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300 mb-1">Faculty / Course <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            className="w-full p-3 border border-neutral-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-[#E51D54] outline-none placeholder:text-neutral-400 dark:placeholder:text-slate-500"
                                            value={formData.faculty}
                                            onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                                            placeholder="e.g. IT Faculty, Engineering"
                                        />
                                    </div>
                                </div>
                            )}

                            {formData.occupation === 'Working Professional' && (
                                <div className="pl-4 border-l-2 border-[#E51D54] animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300 mb-1">Workplace / Company <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            className="w-full p-3 border border-neutral-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-[#E51D54] outline-none placeholder:text-neutral-400 dark:placeholder:text-slate-500"
                                            value={formData.workplace}
                                            onChange={(e) => setFormData({ ...formData, workplace: e.target.value })}
                                            placeholder="e.g. Virtusa, IFS"
                                        />
                                    </div>
                                </div>
                            )}

                            {formData.occupation === 'Other' && (
                                <div className="pl-4 border-l-2 border-[#E51D54] animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300 mb-1">Please Describe <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            className="w-full p-3 border border-neutral-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-[#E51D54] outline-none placeholder:text-neutral-400 dark:placeholder:text-slate-500"
                                            value={formData.otherDescription}
                                            onChange={(e) => setFormData({ ...formData, otherDescription: e.target.value })}
                                            placeholder="Describe your occupation or reason for stay"
                                        />
                                    </div>
                                </div>
                            )}


                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300 mb-1">National ID (NIC)</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-neutral-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-[#E51D54] outline-none placeholder:text-neutral-400 dark:placeholder:text-slate-500"
                                    value={formData.nic}
                                    onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
                                    placeholder="Enter your NIC number"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300 mb-1">Message to Provider</label>
                                <textarea
                                    rows={4}
                                    className="w-full p-3 border border-neutral-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-[#E51D54] outline-none placeholder:text-neutral-400 dark:placeholder:text-slate-500"
                                    value={formData.note}
                                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                    placeholder="Introduce yourself..."
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP: AGREEMENT */}
                    {currentStep.id === 'agreement' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="font-bold text-lg">Review House Rules & Agreement</h3>
                            <div className="bg-neutral-50 dark:bg-slate-800 p-4 rounded-xl border border-neutral-200 dark:border-slate-700 text-sm max-h-60 overflow-y-auto w-full">
                                <h4 className="font-bold mb-2 text-neutral-900 dark:text-white">
                                    {listing.agreementTemplate ? listing.agreementTemplate.name : "Standard Boarding Agreement"}
                                </h4>
                                <div className="whitespace-pre-wrap text-neutral-600 dark:text-slate-300">
                                    {listing.agreementTemplate
                                        ? listing.agreementTemplate.content
                                        : "By continuing, I agree to respect the property, follow the provider's house rules, and pay the agreed rent and deposit. I understand that my booking request is subject to provider approval."}
                                </div>
                            </div>

                            <label className="flex items-start gap-3 p-3 border border-neutral-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors w-full">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center mt-0.5 ${formData.agreementAccepted ? 'bg-[#E51D54] border-[#E51D54]' : 'border-neutral-300 dark:border-slate-600'}`}>
                                    {formData.agreementAccepted && <Check size={14} className="text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={formData.agreementAccepted}
                                    onChange={(e) => setFormData({ ...formData, agreementAccepted: e.target.checked })}
                                />
                                <span className="text-sm text-neutral-700 dark:text-slate-300 select-none">
                                    I agree to the House Rules, Terms of Service, and understand that my booking request is subject to provider approval.
                                </span>
                            </label>
                        </div>
                    )}

                    {/* STEP: CONFIRM */}
                    {currentStep.id === 'confirm' && (
                        <div className="space-y-6 text-center py-4 animate-in fade-in zoom-in-95 duration-300">
                            <div className="w-16 h-16 bg-neutral-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check size={32} className="text-[#E51D54]" />
                            </div>
                            <h3 className="font-bold text-2xl text-neutral-900 dark:text-white">Ready to send?</h3>
                            <p className="text-neutral-500 dark:text-slate-400">
                                The provider will review your request. You won't be charged until they accept.
                            </p>

                            <div className="bg-neutral-50 dark:bg-slate-800 p-4 rounded-xl text-left space-y-2 border border-neutral-200 dark:border-slate-700">
                                <div className="flex justify-between">
                                    <span className="text-neutral-600 dark:text-slate-400">Listing</span>
                                    <span className="font-medium text-right text-neutral-900 dark:text-white">{listing.title}</span>
                                </div>
                                {selectedRoom && (
                                    <div className="flex justify-between">
                                        <span className="text-neutral-600 dark:text-slate-400">Room</span>
                                        <span className="font-medium text-right text-neutral-900 dark:text-white">{selectedRoom.name}</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t border-neutral-200 dark:border-slate-700 pt-2 mt-2">
                                    <span className="text-neutral-600 dark:text-slate-400 font-bold">Total Estimate</span>
                                    <span className="font-bold text-[#E51D54]">
                                        LKR {(selectedRoom ? selectedRoom.price : (listing.rent || 0)).toLocaleString()}/mo
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-neutral-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
                    <div className="flex gap-4">
                        {currentStepIndex > 0 && (
                            <button
                                onClick={handleBack}
                                className="px-6 py-3 font-bold text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                Back
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            disabled={loading}
                            className="flex-1 bg-[#E51D54] text-white font-bold py-3 rounded-xl hover:bg-[#d01b4b] transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? 'Sending...' : (currentStep.id === 'confirm') ? 'Send Request' : 'Next'}
                            {!loading && currentStep.id !== 'confirm' && <ChevronRight size={20} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingWizard;

