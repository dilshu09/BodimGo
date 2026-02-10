import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Home, FileText, CheckCircle, ChevronRight, Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const STEPS = [
    { id: 1, title: "Select Room", icon: Home },
    { id: 2, title: "Tenant Details", icon: User },
    { id: 3, title: "Agreement", icon: FileText },
    { id: 4, title: "Finish", icon: CheckCircle }
];

const ManualAddTenant = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Data Loading
    const [listings, setListings] = useState([]);

    // Form State
    const [selectedListing, setSelectedListing] = useState('');
    const [selectedRoom, setSelectedRoom] = useState('');
    const [tenantData, setTenantData] = useState({
        name: '',
        phone: '',
        email: '',
        nic: ''
    });

    const [signingLink, setSigningLink] = useState('');
    const [agreementTemplates, setAgreementTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Fetch Published listings
                const resListings = await api.get('/listings/my');
                setListings(resListings.data.data.filter(l => l.status === 'Published') || []);

                // Fetch Agreement Templates
                const resTemplates = await api.get('/agreements/templates');
                setAgreementTemplates(resTemplates.data.data || []);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load initial data.");
            }
        };
        loadInitialData();
    }, []);

    // Get rooms for selected listing
    const availableRooms = listings.find(l => l._id === selectedListing)?.rooms || [];

    const handleNext = async () => {
        if (step === 1 && (!selectedListing || !selectedRoom)) {
            toast.error("Please select a property and room.");
            return;
        }
        if (step === 2 && (!tenantData.name || !tenantData.nic)) {
            toast.error("Name and NIC are required.");
            return;
        }

        // Step 2 -> 3: Create Tenant in Backend
        if (step === 2) {
            setLoading(true);
            try {
                const res = await api.post('/tenants', {
                    listingId: selectedListing,
                    roomId: selectedRoom,
                    ...tenantData
                });

                if (res.data.success) {
                    setTenantData(prev => ({ ...prev, _id: res.data.data._id })); // Save ID
                    toast.success("Tenant created successfully.");
                    setStep(3);
                }
            } catch (err) {
                console.error(err);
                toast.error(err.response?.data?.message || "Failed to create tenant.");
            } finally {
                setLoading(false);
            }
            return;
        }

        // Step 3 -> 4: Generate Agreement Link
        if (step === 3) {
            setLoading(true);
            try {
                const res = await api.post(`/tenants/${tenantData._id}/agreement`, {
                    templateId: selectedTemplate
                });
                if (res.data.success) {
                    setSigningLink(res.data.data.signingLink);
                    setStep(4);
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to generate agreement link.");
            } finally {
                setLoading(false);
            }
            return;
        }

        setStep(prev => prev + 1);
    };

    const copyLink = () => {
        navigator.clipboard.writeText(signingLink);
        toast.success("Link copied!");
    };

    return (
        <div className="min-h-screen bg-neutral-50 p-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-neutral-800 mb-8">Add New Tenant</h1>

                {/* Stepper */}
                <div className="flex items-center justify-between mb-8 relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-neutral-200 -z-10"></div>
                    {STEPS.map((s) => (
                        <div key={s.id} className={`flex flex-col items-center bg-neutral-50 px-2 ${step >= s.id ? 'text-primary' : 'text-neutral-400'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 ${step >= s.id ? 'bg-white border-primary' : 'bg-neutral-100 border-neutral-300'}`}>
                                <s.icon size={20} />
                            </div>
                            <span className="text-xs font-bold">{s.title}</span>
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="bg-white rounded-2xl shadow-card p-8 min-h-[400px]">
                    {step === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold">Select Property & Room</h2>
                            <div>
                                <label className="block text-sm font-medium mb-2">Property</label>
                                <select
                                    className="w-full input-field"
                                    value={selectedListing}
                                    onChange={e => setSelectedListing(e.target.value)}
                                >
                                    <option value="">-- Select --</option>
                                    {listings.map(l => (
                                        <option key={l._id} value={l._id}>{l.title}</option>
                                    ))}
                                </select>
                            </div>
                            {selectedListing && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Room</label>
                                    <select
                                        className="w-full input-field"
                                        value={selectedRoom}
                                        onChange={e => setSelectedRoom(e.target.value)}
                                    >
                                        <option value="">-- Select Room --</option>
                                        {availableRooms.map(r => (
                                            <option key={r._id} value={r._id}>
                                                {r.name} ({r.type}) - LKR {r.price}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold">Tenant Information</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Full Name</label>
                                    <input type="text" className="w-full input-field" value={tenantData.name} onChange={e => setTenantData({ ...tenantData, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">NIC No</label>
                                    <input type="text" className="w-full input-field" value={tenantData.nic} onChange={e => setTenantData({ ...tenantData, nic: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Phone</label>
                                    <input type="text" className="w-full input-field" value={tenantData.phone} onChange={e => setTenantData({ ...tenantData, phone: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email (Optional)</label>
                                    <input type="email" className="w-full input-field" value={tenantData.email} onChange={e => setTenantData({ ...tenantData, email: e.target.value })} />
                                </div>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-700">
                                This will create a pending tenant record. The tenant will become active once the agreement is signed.
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 text-center py-8">
                            <FileText size={48} className="mx-auto text-primary mb-4" />
                            <h2 className="text-xl font-bold">Generate Agreement</h2>
                            <p className="text-neutral-500 max-w-md mx-auto">
                                The system will generate a standardized lease agreement based on your template.
                                You can choose to sign it now (if tenant is present) or send a link.
                            </p>

                            <div className="max-w-md mx-auto mb-6 text-left">
                                <label className="block text-sm font-medium mb-2">Select Agreement Template</label>
                                <select
                                    className="w-full input-field"
                                    value={selectedTemplate}
                                    onChange={(e) => setSelectedTemplate(e.target.value)}
                                >
                                    <option value="">-- Use Default Template --</option>
                                    {agreementTemplates.map(t => (
                                        <option key={t._id} value={t._id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-center gap-4 mt-8">
                                <button
                                    className="btn-primary px-6 py-3 shadow-lg shadow-primary/25"
                                    onClick={() => handleNext()}
                                >
                                    {loading ? 'Generating...' : 'Generate & Send Link'}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6 text-center py-8">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} />
                            </div>
                            <h2 className="text-2xl font-bold">Signing Link Ready!</h2>
                            <p className="text-neutral-500">Share this link with your tenant to complete the onboarding.</p>

                            <div className="bg-neutral-100 p-4 rounded-xl flex items-center justify-between max-w-md mx-auto border border-neutral-200">
                                <code className="text-sm font-mono text-neutral-600 truncate">{signingLink}</code>
                                <button onClick={copyLink} className="p-2 hover:bg-white rounded-lg transition-colors">
                                    <Copy size={18} />
                                </button>
                            </div>

                            <button onClick={() => navigate('/dashboard')} className="btn-primary mt-8">
                                Return to Dashboard
                            </button>
                        </div>
                    )}
                </div>

                {/* Nav */}
                {step < 3 && (
                    <div className="flex justify-between mt-8">
                        <button
                            disabled={step === 1}
                            onClick={() => setStep(prev => prev - 1)}
                            className="bg-white border border-neutral-200 px-6 py-3 rounded-xl font-semibold text-neutral-600 disabled:opacity-50"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleNext}
                            className="btn-primary px-8 py-3 flex items-center gap-2"
                        >
                            Next <ChevronRight size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManualAddTenant;
