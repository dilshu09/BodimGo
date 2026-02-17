import { useState } from 'react';
import { CheckCircle, AlertTriangle, X, Plus, Loader2, PlayCircle, BedDouble, Camera, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const RoomFormModal = ({ room, onSave, onClose }) => {
    const [formData, setFormData] = useState(room || {
        name: '',
        type: 'Single Room',
        occupancyMode: 'Entire Room',
        capacity: 1,
        price: '',
        features: { bathroomType: 'Shared' },
        images: []
    });
    const [uploading, setUploading] = useState(false);
    const [analysisStatus, setAnalysisStatus] = useState('idle'); // idle, analyzing, approved, rejected
    const [analysisError, setAnalysisError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + (formData.images?.length || 0) > 5) {
            toast.error("Max 5 images per room");
            return;
        }

        setUploading(true);
        const fileReaders = files.map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });
        });

        Promise.all(fileReaders)
            .then(base64Images => {
                setFormData(prev => ({ ...prev, images: [...(prev.images || []), ...base64Images] }));
                setAnalysisStatus('idle'); // Reset status on new upload
                setUploading(false);
            })
            .catch(err => {
                console.error(err);
                toast.error("Error reading files");
                setUploading(false);
            });
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
        setAnalysisStatus('idle'); // Force re-check or just idle
    };

    const handleAnalyze = async () => {
        // Filter only new base64 images to check (or check all to be safe)
        // Since we don't track which are new easily here without diff, let's check all base64 ones.
        const imagesToCheck = formData.images.filter(img => img.startsWith('data:image'));

        if (imagesToCheck.length === 0) {
            setAnalysisStatus('approved');
            return;
        }

        try {
            setAnalysisStatus('analyzing');
            setAnalysisError('');

            const res = await api.post('/ai/validate-images', { images: imagesToCheck });

            if (res.data.isValid) {
                setAnalysisStatus('approved');
                toast.success("Photos Verified by AI");
            } else {
                setAnalysisStatus('rejected');
                const reason = res.data.flaggedImages[0]?.reason || "Contains inappropriate content";
                setAnalysisError(reason);
                toast.error(`Image Rejected: ${reason}`);
            }
        } catch (error) {
            console.error(error);
            setAnalysisStatus('idle');
            toast.error("AI Check Failed. Please try again.");
        }
    };

    // Determine if we need analysis
    // If there are base64 images and status is not approved, we need analysis.
    const needsAnalysis = formData.images?.some(img => img.startsWith('data:image')) && analysisStatus !== 'approved';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-scale-up border border-neutral-200 dark:border-slate-700 shadow-xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-full text-neutral-500 dark:text-slate-400 z-10"
                >
                    <X size={20} />
                </button>

                <div className="p-6">
                    <h2 className="text-2xl font-bold text-neutral-800 dark:text-white mb-2">
                        {room ? 'Edit Room' : 'Add New Room'}
                    </h2>
                    <p className="text-neutral-500 dark:text-slate-400 mb-6">
                        {room ? 'Update the details for this room.' : 'Fill in the details for the new room.'}
                    </p>

                    <div className="space-y-6">
                        {/* Basic Info */}
                        <div>
                            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Room Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                placeholder="e.g. Master Bedroom"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Type</label>
                                <select name="type" value={formData.type} onChange={handleChange} className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                                    <option>Single Room</option>
                                    <option>Double Room</option>
                                    <option>Shared Room</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Capacity</label>
                                <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Monthly Rent (LKR)</label>
                            <input type="number" name="price" value={formData.price} onChange={handleChange} className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Bathroom</label>
                            <select name="features.bathroomType" value={formData.features?.bathroomType} onChange={handleChange} className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                                <option>Shared</option>
                                <option>Attached</option>
                            </select>
                        </div>

                        {/* Photo Upload */}
                        <div>
                            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2 flex justify-between">
                                <span>Room Photos ({formData.images?.length || 0}/3)</span>
                                {analysisStatus === 'approved' && <span className="text-xs font-bold text-green-600 flex items-center gap-1"><CheckCircle size={12} /> Verified</span>}
                                {analysisStatus === 'rejected' && <span className="text-xs font-bold text-red-600 flex items-center gap-1"><AlertTriangle size={12} /> {analysisError}</span>}
                            </label>

                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {formData.images?.map((img, idx) => (
                                    <div key={idx} className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden border border-neutral-200 dark:border-slate-700 group">
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                                {(formData.images?.length || 0) < 3 && (
                                    <div className="relative w-24 h-24 flex-shrink-0 border-2 border-dashed border-neutral-300 dark:border-slate-600 rounded-xl hover:bg-neutral-50 dark:hover:bg-slate-700 hover:border-primary transition-colors flex flex-col items-center justify-center cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImageUpload}
                                            disabled={uploading}
                                            className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-wait"
                                        />
                                        {uploading ? (
                                            <Loader2 className="animate-spin text-primary" size={20} />
                                        ) : (
                                            <>
                                                <Camera size={20} className="text-neutral-400 dark:text-slate-500 mb-1" />
                                                <span className="text-[10px] text-neutral-500 dark:text-slate-400 font-bold">Add</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-neutral-100 dark:border-slate-700 flex justify-end gap-3 flex-shrink-0 bg-white dark:bg-slate-900">
                    <button onClick={onClose} className="px-4 py-2 text-neutral-600 dark:text-slate-300 font-semibold hover:bg-neutral-50 dark:hover:bg-slate-800 rounded-lg">Cancel</button>

                    {needsAnalysis ? (
                        <button
                            onClick={handleAnalyze}
                            disabled={analysisStatus === 'analyzing' || uploading}
                            className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {analysisStatus === 'analyzing' ? (
                                <><span>Analyzing...</span><Loader className="animate-spin" size={16} /></>
                            ) : (
                                <><span>Analyze Photos</span><PlayCircle size={16} /></>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={() => onSave(formData)}
                            disabled={uploading || analysisStatus === 'rejected'}
                            className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark disabled:opacity-50"
                        >
                            {uploading ? 'Is Saving...' : 'Save Room'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RoomFormModal;
