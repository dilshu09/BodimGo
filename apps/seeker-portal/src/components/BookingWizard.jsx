import React, { useState } from 'react';
import { X, ChevronRight, Check } from 'lucide-react';
import api from '../services/api';

const BookingWizard = ({ listing, onClose, onSuccess, user }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        nic: '',
        occupation: 'Student',
        note: '',
        phone: user?.phone || '',
        address: user?.address || '',
        gender: '',
        agreementAccepted: false,
        // New Fields
        organization: '', // University/Institute
        faculty: '',      // Faculty/Course
        workplace: '',    // Company
        otherDescription: '' // Other
    });

    const totalSteps = 3;

    const validateStep1 = () => {
        if (!formData.name.trim()) return "Full Name is required";
        if (!formData.gender) return "Gender is required";
        if (!formData.phone.trim()) return "Phone Number is required";
        if (!formData.address.trim()) return "Address is required";

        // Occupation Specific Validation
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
        if (step === 1) {
            const error = validateStep1();
            if (error) {
                alert(error);
                return;
            }
        }
        if (step === 2 && !formData.agreementAccepted) {
            alert("You must accept the agreement to proceed.");
            return;
        }
        setStep(prev => prev + 1);
    };

    const handleBack = () => setStep(prev => prev - 1);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const rent = listing.rooms && listing.rooms.length > 0
                ? Math.min(...listing.rooms.map(r => r.price))
                : (listing.rent || 0);

            await api.post('/bookings', {
                listingId: listing._id,
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
                    // Send specific fields
                    organization: formData.occupation === 'Student' ? formData.organization : undefined,
                    faculty: formData.occupation === 'Student' ? formData.faculty : undefined,
                    workplace: formData.occupation === 'Working Professional' ? formData.workplace : undefined,
                    otherDescription: formData.occupation === 'Other' ? formData.otherDescription : undefined,
                },
                agreementAccepted: formData.agreementAccepted
            });
            onSuccess();
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || "Failed to send request.";
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-white sticky top-0">
                    <div>
                        <h2 className="text-xl font-bold text-neutral-900">Request to Book</h2>
                        <p className="text-sm text-neutral-500">Step {step} of {totalSteps}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {step === 1 && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg">Tell the provider about yourself</h3>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#E51D54] outline-none"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter your full name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Gender <span className="text-red-500">*</span></label>
                                <select
                                    className="w-full p-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#E51D54] focus:border-transparent outline-none"
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                                <input
                                    type="tel"
                                    className="w-full p-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#E51D54] outline-none"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+94 7X XXX XXXX"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Address <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#E51D54] outline-none"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Your permanent address"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Occupation <span className="text-red-500">*</span></label>
                                <select
                                    className="w-full p-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#E51D54] focus:border-transparent outline-none"
                                    value={formData.occupation}
                                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                                >
                                    <option value="Student">Student</option>
                                    <option value="Working Professional">Working Professional</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            {/* Conditional Fields */}
                            {formData.occupation === 'Student' && (
                                <div className="pl-4 border-l-2 border-[#E51D54] space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">University / Institute <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            className="w-full p-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#E51D54] outline-none"
                                            value={formData.organization}
                                            onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                            placeholder="e.g. SLIIT, NSBM, UOM"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Faculty / Course <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            className="w-full p-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#E51D54] outline-none"
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
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Workplace / Company <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            className="w-full p-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#E51D54] outline-none"
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
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Please Describe <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            className="w-full p-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#E51D54] outline-none"
                                            value={formData.otherDescription}
                                            onChange={(e) => setFormData({ ...formData, otherDescription: e.target.value })}
                                            placeholder="Describe your occupation or reason for stay"
                                        />
                                    </div>
                                </div>
                            )}


                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">National ID (NIC)</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#E51D54] outline-none"
                                    value={formData.nic}
                                    onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
                                    placeholder="Enter your NIC number"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Message to Provider</label>
                                <textarea
                                    rows={4}
                                    className="w-full p-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#E51D54] outline-none"
                                    value={formData.note}
                                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                    placeholder="Introduce yourself..."
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg">Review House Rules & Agreement</h3>
                            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-sm max-h-60 overflow-y-auto">
                                <h4 className="font-bold mb-2">
                                    {listing.agreementTemplate ? listing.agreementTemplate.name : "Standard Boarding Agreement"}
                                </h4>
                                <div className="whitespace-pre-wrap text-neutral-600">
                                    {listing.agreementTemplate
                                        ? listing.agreementTemplate.content
                                        : "By continuing, I agree to respect the property, follow the provider's house rules, and pay the agreed rent and deposit. I understand that my booking request is subject to provider approval."}
                                </div>
                            </div>

                            <label className="flex items-start gap-3 p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center mt-0.5 ${formData.agreementAccepted ? 'bg-[#E51D54] border-[#E51D54]' : 'border-neutral-300'}`}>
                                    {formData.agreementAccepted && <Check size={14} className="text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={formData.agreementAccepted}
                                    onChange={(e) => setFormData({ ...formData, agreementAccepted: e.target.checked })}
                                />
                                <span className="text-sm text-neutral-700 select-none">
                                    I agree to the House Rules, Terms of Service, and understand that my booking request is subject to provider approval.
                                </span>
                            </label>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 text-center py-4">
                            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check size={32} className="text-[#E51D54]" />
                            </div>
                            <h3 className="font-bold text-2xl">Ready to send?</h3>
                            <p className="text-neutral-500">
                                The provider will review your request. You won't be charged until they accept.
                            </p>

                            <div className="bg-neutral-50 p-4 rounded-xl text-left space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-neutral-600">Listing</span>
                                    <span className="font-medium">{listing.title}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-600">Total Estimate</span>
                                    <span className="font-medium">LKR {(listing.rooms && listing.rooms.length > 0 ? Math.min(...listing.rooms.map(r => r.price)) : (listing.rent || 0)).toLocaleString()}/mo</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-neutral-100 bg-white">
                    <div className="flex gap-4">
                        {step > 1 && (
                            <button
                                onClick={handleBack}
                                className="px-6 py-3 font-bold text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors"
                            >
                                Back
                            </button>
                        )}
                        <button
                            onClick={(step === totalSteps) ? handleSubmit : handleNext}
                            disabled={loading}
                            className="flex-1 bg-[#E51D54] text-white font-bold py-3 rounded-xl hover:bg-[#d01b4b] transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? 'Sending...' : (step === totalSteps) ? 'Send Request' : 'Next'}
                            {!loading && step < totalSteps && <ChevronRight size={20} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingWizard;
