import { useState, useRef, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import StepBasicInfo from '../components/listing-wizard/StepBasicInfo';
import StepLocation from '../components/listing-wizard/StepLocation';
import StepHouseRules from '../components/listing-wizard/StepHouseRules';
import StepPricing from '../components/listing-wizard/StepPricing';
import StepFacilities from '../components/listing-wizard/StepFacilities';
import StepImages from '../components/listing-wizard/StepImages';
import StepRooms from '../components/listing-wizard/StepRooms';
import { Save, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const libraries = ['places'];

const STEPS = [
    { id: 1, title: "Basic Info" },
    { id: 2, title: "Location" },
    { id: 3, title: "House Rules" },
    { id: 4, title: "Pricing" },
    { id: 5, title: "Facilities" },
    { id: 6, title: "Images" },
    { id: 7, title: "Rooms" }
];

const INITIAL_DATA = {
    title: '',
    type: 'Annex',
    genderPolicy: 'Mixed',
    description: '',
    rules: {
        visitors: { allowed: true, genderRestriction: 'Any', visitingHours: '', overnightAllowed: false },
        cooking: { allowed: false, area: 'Shared Kitchen', mealsProvided: 'None' },
        curfew: { enabled: false, time: '', lateEntryAllowed: true },
        substances: { smokingAllowed: false, alcoholAllowed: false },
        noise: { quietHours: '', loudMusicAllowed: false },
        cleaning: { responsibility: 'Tenant' },
        laundry: { machineAvailable: false },
        pets: { allowed: false },
        security: { emergencyContactRequired: true },
        additionalNotes: ''
    },
    location: {
        province: '',
        district: '',
        city: '',
        address: '',
        coordinates: { lat: 0, lng: 0 }
    },
    pricingDefaults: {
        rentModel: 'Per Room',
        billingCycle: 'Monthly',
        billsPolicy: 'Included',
        deposit: { amount: 0, refundable: true },
        utilities: { electricity: 'Included', water: 'Included', wifi: 'Included' }
    },
    facilities: [],
    images: [],
    rooms: [],
    agreementTemplate: null
};

const SuccessModal = ({ isOpen, onClose, onView, isFlagged }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
            >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isFlagged ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                    {isFlagged ? <CheckCircle size={40} strokeWidth={3} /> : <CheckCircle size={40} strokeWidth={3} />}
                </div>
                <h2 className="text-2xl font-bold text-neutral-800 mb-2">
                    {isFlagged ? 'Submitted for Review' : 'Listing Published!'}
                </h2>
                <p className="text-neutral-500 mb-8">
                    {isFlagged
                        ? "Your listing contains content flagged by our safety system. It will be reviewed by an admin shortly."
                        : "Your property is now live and visible to seekers. You can manage it from your dashboard."
                    }
                </p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={onView}
                        className="btn-primary w-full py-3 text-lg shadow-lg shadow-primary/30"
                    >
                        View Listing
                    </button>
                    <button
                        onClick={onClose}
                        className="text-neutral-500 font-medium hover:text-neutral-800 transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const AddListing = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('editing');
    // Optional: get start step from query
    const startStep = searchParams.get('step') ? parseInt(searchParams.get('step')) : 1;

    // Load Maps API at Parent Level
    const { isLoaded: isMapsLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries
    });

    useEffect(() => {
        if (loadError) {
            toast.error("Google Maps failed to load. Please disable AdBlocker or check connection.");
            console.error("Maps Load Error:", loadError);
        }
    }, [loadError]);

    const [currentStep, setCurrentStep] = useState(startStep);
    const [formData, setFormData] = useState(INITIAL_DATA);
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Track if listing is flagged by AI
    const [isFlagged, setIsFlagged] = useState(false);
    const [flagDetails, setFlagDetails] = useState([]); // Store specific reasons for Admin

    // --- Edit Mode Logic ---
    useEffect(() => {
        if (editId) {
            const loadListing = async () => {
                try {
                    setLoading(true);
                    const res = await api.get(`/listings/${editId}`);
                    if (res.data) {
                        setFormData(prev => ({ ...prev, ...res.data }));
                    }
                } catch (err) {
                    console.error("Failed to load listing for edit", err);
                    toast.error("Could not load listing details");
                } finally {
                    setLoading(false);
                }
            };
            loadListing();
        }
    }, [editId]);

    // Safety check for empty rooms
    const sanitizeDataBeforeSubmit = () => {
        const payload = JSON.parse(JSON.stringify(formData));

        if (!payload.pricingDefaults.billsPolicy) {
            payload.pricingDefaults.billsPolicy = 'Included';
        }

        payload.rooms = payload.rooms.map(r => {
            let mode = r.occupancyMode || r.bookingMode || 'Entire Room';
            if (mode === 'Per Room') mode = 'Entire Room';

            return {
                ...r,
                price: Number(r.price || r.rent) || 0,
                capacity: Number(r.capacity || r.beds) || 1,
                occupancyMode: mode,
                status: r.status || 'Available',
                features: r.features || { bathroomType: 'Shared', furnishing: [] },
                images: r.images || []
            };
        });

        const mealsMap = { 'Breakfast Only': 'Breakfast', 'Lunch Only': 'Lunch', 'Dinner Only': 'Dinner', 'All Meals': 'All' };
        const currentMeals = payload.rules?.cooking?.mealsProvided;
        if (mealsMap[currentMeals]) {
            payload.rules.cooking.mealsProvided = mealsMap[currentMeals];
        } else if (!['None', 'Breakfast', 'Lunch', 'Dinner', 'All'].includes(currentMeals)) {
            payload.rules.cooking.mealsProvided = 'None';
        }

        return payload;
    };

    // Verification States
    const [verifying, setVerifying] = useState(false);
    const [step1Verified, setStep1Verified] = useState(false);
    const [step1Errors, setStep1Errors] = useState({ title: '', description: '' });
    const [step2Verified, setStep2Verified] = useState(false);
    const [step2Errors, setStep2Errors] = useState({});
    const [step6Verified, setStep6Verified] = useState(false);
    const [step6Errors, setStep6Errors] = useState({});

    const updateData = (newData) => {
        setFormData(prev => ({ ...prev, ...newData }));
        if (currentStep === 1 && (newData.title !== undefined || newData.description !== undefined)) setStep1Verified(false);
        if (currentStep === 2 && newData.location) setStep2Verified(false);
        if (currentStep === 6 && newData.images) setStep6Verified(false);
    };

    // --- Verification Functions  ---


    const verifyStep1 = async () => {
        if (!formData.title || !formData.description) { toast.error("Please fill title/desc"); return; }

        try {
            setVerifying(true);
            const t = toast.loading("AI Agent verifying content...");

            // Call Backend AI Agent
            const res = await api.post('/ai/validate-text', {
                text: formData.description,
                field: 'description' // Context for AI
            });

            toast.dismiss(t);

            if (!res.data.isValid) {
                // BLOCKING FLOW
                const errorMsg = res.data.errors?.[0] || "Content flagged by AI safety guidelines.";

                setStep1Errors({
                    ...step1Errors,
                    description: errorMsg
                });

                toast.error(errorMsg);
                setStep1Verified(false);
                setVerifying(false); // Stop loader
                return; // STOP HERE
            }

            // Success (Clean)
            setStep1Errors({ title: '', description: '' });
            setStep1Verified(true);
            setVerifying(false);
            toast.success("AI Verification Passed!");
            setTimeout(() => setCurrentStep(2), 500);

        } catch (err) {
            console.error("AI Validation Failed:", err);
            toast.dismiss();
            toast.error("AI Service Unavailable. Proceeding...");
            setStep1Verified(true); // Allow proceed on error
            setVerifying(false);
            setTimeout(() => setCurrentStep(2), 1000);
        }
    };
    const verifyStep2 = async () => {
        if (!formData.location.city) { toast.error("Please fill location"); return; }

        // Add AI Location Verification
        try {
            setVerifying(true);
            const t = toast.loading("Verifying address...");
            const res = await api.post('/ai/verify-location', formData.location);
            toast.dismiss(t);

            if (!res.data.isValid) {
                const errorMsg = Object.values(res.data.errors || {}).join(', ');
                setStep2Errors({ general: errorMsg });
                toast.error(errorMsg || "Location mismatch detected.");
                setStep2Verified(false);
                setVerifying(false);
                return;
            }

            setStep2Verified(true);
            setVerifying(false);
            setCurrentStep(3);

        } catch (err) {
            console.error(err);
            // If AI fails, maybe allow proceed or block? User said "if location wrong show error"
            // Let's assume strict blocking for consistency, or soft allow if server error.
            setStep2Verified(true);
            setVerifying(false);
            setCurrentStep(3);
        }
    };
    const verifyStep6 = async () => {
        if (!formData.images.length) { toast.error("Please upload photos"); return; }

        try {
            setVerifying(true);
            const t = toast.loading("AI Agent analyzing photos...");

            const res = await api.post('/ai/validate-images', {
                images: formData.images
            });

            toast.dismiss(t);

            if (!res.data.isValid) {
                // BLOCKING FLOW
                const flagged = res.data.flaggedImages;
                const errorMsg = flagged[0]?.reason || "Images rejected by AI Safety check.";

                setStep6Errors({ flaggedImages: flagged });

                toast.error(`Blocked: ${errorMsg}`);

                setStep6Verified(false);
                setVerifying(false);
                return; // STOP HERE
            }

            // Success
            setStep6Errors({});
            setStep6Verified(true);
            setVerifying(false);
            toast.success("AI Photo Verification Passed!");
            setTimeout(() => setCurrentStep(7), 500);

        } catch (err) {
            console.error("AI Image Check Failed:", err);
            toast.dismiss();
            toast.error("AI Service Unavailable. Processing...");
            setStep6Verified(true);
            setVerifying(false);
            setTimeout(() => setCurrentStep(7), 1000);
        }
    };
    const verifyStep7 = async () => {
        if (!formData.rooms.length) { toast.error("Add a room"); return; }
        handlePublish();
    };


    const handlePublish = async () => {
        setLoading(true);
        const tId = toast.loading(editId ? 'Updating listing...' : 'Submitting...');
        const payload = sanitizeDataBeforeSubmit();

        // Determine Final Status
        const finalStatus = isFlagged ? 'hidden_by_audit' : 'active';

        // Attach Audit Log if flagged
        if (isFlagged) {
            payload.auditLog = flagDetails;
        }

        try {
            if (editId) {
                await api.put(`/listings/${editId}`, { ...payload, status: finalStatus });
                toast.success("Listing Updated!");
            } else {
                await api.post('/listings', { ...payload, status: finalStatus });
                toast.success("Listing Submitted!");
            }
            toast.dismiss(tId);
            setShowSuccess(true);
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.error || err.response?.data?.message || 'Error publishing listing';
            toast.error(msg, { id: tId });
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        // Skip sophisticated verification for edit mode simplicity in this fix, or re-enable
        if (currentStep === 1 && !step1Verified) { verifyStep1(); return; }
        if (currentStep === 2 && !step2Verified) { verifyStep2(); return; }
        if (currentStep === 6 && !step6Verified) { verifyStep6(); return; }
        if (currentStep === 7) { verifyStep7(); return; }
        setCurrentStep(prev => Math.min(prev + 1, 7));
    };

    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    // Dynamic Button Text
    const getNextButtonText = () => {
        if (currentStep === 7) return editId ? "Update Listing" : "Verify & Publish";
        return "Next Step";
    };

    return (
        <div className="min-h-screen bg-neutral-50 relative">
            <Toaster position="top-center" />
            <div className="max-w-5xl mx-auto px-4 pt-8">
                <h1 className="text-3xl font-bold text-neutral-800">{editId ? 'Edit Listing' : 'Create New Listing'}</h1>
                <p className="text-neutral-500 mt-1">{editId ? 'Update your property details.' : 'Follow the steps below to publish your property.'}</p>
            </div>

            <AnimatePresence>
                {showSuccess && (
                    <SuccessModal
                        isOpen={showSuccess}
                        onClose={() => navigate('/dashboard')}
                        onView={() => navigate('/dashboard')}
                        isFlagged={isFlagged}
                    />
                )}
            </AnimatePresence>



            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Progress Bar */}
                <div className="mb-8 overflow-x-auto pb-2">
                    <div className="flex items-center justify-between min-w-[600px] mb-2">
                        {STEPS.map((step) => (
                            <div key={step.id} className={`flex flex-col items-center ${step.id <= currentStep ? 'text-primary' : 'text-neutral-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-1 transition-colors ${step.id <= currentStep ? 'bg-primary text-white' : 'bg-neutral-200 text-neutral-500'}`}>
                                    {step.id < currentStep ? <CheckCircle size={16} /> : step.id}
                                </div>
                                <span className="text-xs font-medium whitespace-nowrap">{step.title}</span>
                            </div>
                        ))}
                    </div>
                    <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-300 ease-out" style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }} />
                    </div>
                </div>

                {/* Step Content */}
                <div className="bg-white rounded-2xl shadow-card border border-neutral-100 p-8 min-h-[500px]">
                    {currentStep === 1 && <StepBasicInfo data={formData} update={updateData} errors={step1Errors} verified={step1Verified} />}
                    {currentStep === 2 && <StepLocation isMapsLoaded={isMapsLoaded} data={formData} update={updateData} errors={step2Errors} verified={step2Verified} />}
                    {currentStep === 3 && <StepHouseRules data={formData} update={updateData} />}
                    {currentStep === 4 && <StepPricing data={formData} update={updateData} />}
                    {currentStep === 5 && <StepFacilities data={formData} update={updateData} />}
                    {currentStep === 6 && <StepImages data={formData} update={updateData} errors={step6Errors} verified={step6Verified} />}
                    {currentStep === 7 && <StepRooms data={formData} update={updateData} />}
                </div>

                {/* Nav */}
                <div className="flex items-center justify-between mt-8">
                    <button onClick={prevStep} disabled={currentStep === 1} className="px-6 py-2.5 rounded-xl font-semibold text-neutral-600 hover:bg-neutral-100 disabled:opacity-50">Back</button>
                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-primary bg-primary/10 hover:bg-primary/20">
                            <Save size={18} /> Save Draft
                        </button>
                        <button onClick={currentStep === 7 ? handlePublish : nextStep} disabled={loading || verifying} className={`btn-primary px-8 transition-all ${currentStep === 7 ? 'bg-green-600 hover:bg-green-700' : ''}`}>
                            {getNextButtonText()}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddListing;
