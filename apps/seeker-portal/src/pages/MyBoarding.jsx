import React, { useState, useEffect } from 'react';
import {
    Home, User, Phone, Mail, MapPin, Calendar,
    CreditCard, Upload, ExternalLink, LogOut, CheckCircle, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import ConfirmationModal from '../components/ConfirmationModal';

const MyBoarding = () => {
    const [tenancy, setTenancy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPayModal, setShowPayModal] = useState(false);
    const [isMoveOutModalOpen, setIsMoveOutModalOpen] = useState(false);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const confirmMoveOut = async () => {
        try {
            await api.post('/tenants/move-out');
            toast.success("Move out request sent to landlord");
            setIsMoveOutModalOpen(false);
        } catch (err) {
            console.error("Failed to request move out", err);
            toast.error(err.response?.data?.message || "Failed to send request");
        }
    };

    const handleSubmitPayment = async () => {
        if (!file || !tenancy) return;

        setUploading(true);
        try {
            // 1. Upload File
            const formData = new FormData();
            formData.append('image', file);

            const uploadRes = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const imageUrl = uploadRes.data.url;

            // 2. Submit Payment Proof
            await api.post('/payments/proof', {
                amount: tenancy.rentAmount,
                proofImageUrl: imageUrl,
                date: new Date()
            });

            // Success
            toast.success("Payment proof submitted successfully!");
            setShowPayModal(false);
            setFile(null);
            // Refresh logic (simple reload or re-fetch)
            window.location.reload();

        } catch (err) {
            console.error("Payment submission failed", err);
            toast.error("Failed to submit payment. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        const fetchTenancy = async () => {
            try {
                const res = await api.get('/tenants/my-tenancy');
                setTenancy(res.data.data);
            } catch (err) {
                console.error("Failed to fetch tenancy", err);
                setError(err.response?.data?.message || "Failed to load boarding details");
                toast.error("Failed to load boarding details");
            } finally {
                setLoading(false);
            }
        };

        fetchTenancy();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-neutral-50 p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <Home size={32} className="text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-neutral-900 mb-2">No Active Boarding Found</h2>
                <p className="text-neutral-500 max-w-md mb-6">{error}</p>
                <a href="/" className="px-6 py-2 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors">
                    Browse Listings
                </a>
            </div>
        );
    }

    if (!tenancy) return null;

    const { listingId: listing, providerId: provider, roomId, rentAmount, paymentHistory } = tenancy;

    // Calculate Next Payment logic safely
    // Default to current month if no payment history, or next month relative to last payment
    const lastPaymentDate = paymentHistory.length > 0 ? new Date(paymentHistory[0].date) : new Date();
    const nextDueDate = new Date(lastPaymentDate);
    if (paymentHistory.length > 0) nextDueDate.setMonth(nextDueDate.getMonth() + 1);

    // If no history, assume due now (start of month). 
    // Actually, let's just use current date logic for MVP display: 
    // "Rent for [Current Month]"
    const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const isPaidCurrentMonth = tenancy.currentMonth?.paid;

    return (
        <div className="min-h-screen bg-neutral-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-neutral-200 sticky top-20 z-10 px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
                        <Home className="text-primary" /> My Boarding Place
                    </h1>
                    <p className="text-sm text-neutral-500">Manage your stay and payments</p>
                </div>
                <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${tenancy.status === 'Active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                        {tenancy.status}
                    </span>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">

                {/* Top Section: Property & Landlord */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Property Details */}
                    <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm hover:shadow-xl hover:border-[#FF385C] transition-all duration-300 lg:col-span-2">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <MapPin size={18} className="text-neutral-400" /> Property Details
                        </h2>
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="w-full md:w-48 h-32 bg-neutral-100 rounded-xl overflow-hidden flex-shrink-0">
                                {listing.images?.[0] ? (
                                    <img src={listing.images[0].url || listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-neutral-400"><Home /></div>
                                )}
                            </div>
                            <div className="flex-1 space-y-3">
                                <div>
                                    <h3 className="font-bold text-xl text-neutral-900">{listing.title}</h3>
                                    <p className="text-neutral-500">{listing.address}</p>
                                </div>
                                <div className="flex gap-4 pt-2">
                                    <div className="bg-neutral-50 px-4 py-2 rounded-lg border border-neutral-100">
                                        <span className="block text-xs text-neutral-400 uppercase font-bold">Room</span>
                                        <span className="font-medium text-neutral-900">{roomId === 'Unassigned' ? 'Shared Space' : roomId}</span>
                                    </div>
                                    <div className="bg-neutral-50 px-4 py-2 rounded-lg border border-neutral-100">
                                        <span className="block text-xs text-neutral-400 uppercase font-bold">Monthly Rent</span>
                                        <span className="font-bold text-primary">Rs {rentAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Landlord Contact */}
                    <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm hover:shadow-xl hover:border-[#FF385C] transition-all duration-300">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <User size={18} className="text-neutral-400" /> Landlord Contact
                        </h2>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center text-xl font-bold text-neutral-400">
                                {provider.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-neutral-900">{provider.name}</h3>
                                <p className="text-xs text-neutral-500">Property Owner</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <a href={`tel:${provider.phone}`} className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 hover:border-primary/50 hover:bg-primary/5 transition-colors group">
                                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-white transition-colors">
                                    <Phone size={16} className="text-neutral-600 group-hover:text-primary transition-colors" />
                                </div>
                                <span className="font-medium text-neutral-700">{provider.phone}</span>
                            </a>
                            <a href={`mailto:${provider.email}`} className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 hover:border-primary/50 hover:bg-primary/5 transition-colors group">
                                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-white transition-colors">
                                    <Mail size={16} className="text-neutral-600 group-hover:text-primary transition-colors" />
                                </div>
                                <span className="font-medium text-neutral-700 truncate">{provider.email}</span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Actions & Payments */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Current Month Status */}
                    <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm hover:shadow-xl hover:border-[#FF385C] transition-all duration-300 lg:col-span-1">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <CreditCard size={18} className="text-neutral-400" /> Rent Status
                        </h2>

                        <div className={`p-4 rounded-xl border mb-6 ${isPaidCurrentMonth ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-center gap-3 mb-2">
                                {isPaidCurrentMonth ? (
                                    <CheckCircle className="text-green-600" size={24} />
                                ) : (
                                    <AlertCircle className="text-red-600" size={24} />
                                )}
                                <span className={`font-bold ${isPaidCurrentMonth ? 'text-green-800' : 'text-red-800'}`}>
                                    {currentMonthName}
                                </span>
                            </div>
                            <p className={`text-sm ${isPaidCurrentMonth ? 'text-green-600' : 'text-red-600'}`}>
                                {isPaidCurrentMonth ? 'Rent Paid' : 'Payment Due'}
                            </p>
                        </div>

                        {!isPaidCurrentMonth && (
                            <button
                                onClick={() => setShowPayModal(true)}
                                className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                            >
                                <Upload size={18} /> Upload Payment Slip
                            </button>
                        )}

                        <div className="mt-4 pt-4 border-t border-neutral-100">
                            <button
                                onClick={() => setIsMoveOutModalOpen(true)}
                                className="w-full py-2 text-neutral-500 hover:text-red-600 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                            >
                                <LogOut size={16} /> Request Move Out
                            </button>
                        </div>
                    </div>

                    {/* Payment History */}
                    <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm hover:shadow-xl hover:border-[#FF385C] transition-all duration-300 lg:col-span-2">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Calendar size={18} className="text-neutral-400" /> Payment History
                        </h2>

                        {paymentHistory.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-xs text-neutral-400 uppercase border-b border-neutral-100">
                                            <th className="py-2 px-4">Month</th>
                                            <th className="py-2 px-4">Date</th>
                                            <th className="py-2 px-4">Amount</th>
                                            <th className="py-2 px-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {paymentHistory.map((payment, i) => (
                                            <tr key={i} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                                                <td className="py-3 px-4 font-medium text-neutral-900">{payment.month}</td>
                                                <td className="py-3 px-4 text-neutral-500">{new Date(payment.date).toLocaleDateString()}</td>
                                                <td className="py-3 px-4 font-bold text-neutral-900">Rs {payment.amount.toLocaleString()}</td>
                                                <td className="py-3 px-4">
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold border border-green-200 block w-fit">
                                                        {payment.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-neutral-500 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                                No payment history found.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {showPayModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
                        <button
                            onClick={() => { setShowPayModal(false); setFile(null); }}
                            className="absolute top-4 right-4 text-neutral-400 hover:text-black"
                        >
                            <LogOut size={20} className="rotate-180" />
                        </button>
                        <h3 className="text-xl font-bold mb-4">Record Payment</h3>
                        <p className="text-neutral-500 mb-6">
                            Upload your bank slip or payment proof for <span className="font-bold text-neutral-900">{currentMonthName}</span>.
                            The provider will verify this manually.
                        </p>

                        <div
                            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors mb-6 
                                ${file ? 'border-primary bg-primary/5' : 'border-neutral-300 hover:bg-neutral-50'}`}
                            onClick={() => document.getElementById('slip-upload').click()}
                        >
                            <input
                                type="file"
                                id="slip-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileSelect}
                            />
                            {file ? (
                                <>
                                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                                        <CheckCircle className="text-primary" size={24} />
                                    </div>
                                    <p className="font-medium text-primary truncate max-w-xs">{file.name}</p>
                                    <p className="text-xs text-neutral-400 mt-1">Click to change</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                                        <Upload className="text-primary" size={24} />
                                    </div>
                                    <p className="font-medium text-neutral-900">Click to upload slip</p>
                                    <p className="text-xs text-neutral-400 mt-1">JPG, PNG or PDF</p>
                                </>
                            )}
                        </div>

                        <button
                            className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                            onClick={handleSubmitPayment}
                            disabled={!file || uploading}
                        >
                            {uploading ? (
                                <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> Uploading...</>
                            ) : (
                                'Submit Payment'
                            )}
                        </button>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={isMoveOutModalOpen}
                title="Request Move Out"
                message="Are you sure you want to request to move out? This will notify the landlord."
                confirmText="Send Request"
                cancelText="Cancel"
                isDanger={false}
                onConfirm={confirmMoveOut}
                onCancel={() => setIsMoveOutModalOpen(false)}
            />
        </div >
    );
};

export default MyBoarding;
