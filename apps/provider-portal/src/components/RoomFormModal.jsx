import { useState } from 'react';
import { CheckCircle, AlertTriangle, X, Plus, Loader2, PlayCircle, BedDouble, Camera, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const RoomFormModal = ({ room, onSave, onClose }) => {
    const [formData, setFormData] = useState(room || {
        name: '',
        type: 'Single',
        occupancyMode: 'Entire Room',
        capacity: 1,
        price: '',
        features: { bathroomType: 'Shared' },
        images: []
    });
    const [uploading, setUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const ROOM_TYPES = ['Single', 'Shared', 'Dormitory', 'Suite', 'Apartment'];
    const OCCUPANCY_MODES = ['Entire Room', 'Per Bed'];

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
        if (files.length + (formData.images?.length || 0) > 3) {
            toast.error("Max 3 images per room");
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
    };

    const handleSave = async () => {
        if (!formData.name || !formData.price) {
            toast.error("Please fill in room name and price");
            return;
        }
        setIsSaving(true);
        try {
            await onSave(formData);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative animate-scale-up border border-neutral-200 dark:border-slate-800 shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 p-2 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-full text-neutral-500 dark:text-slate-400 z-10"
                >
                    <X size={20} />
                </button>

                <div className="p-8">
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
                        {room ? 'Edit Room' : 'Add New Room'}
                    </h2>
                    <p className="text-neutral-500 dark:text-slate-400 text-sm mb-8">
                        {room ? 'Update the details for this unit.' : 'Enter the details for the new unit.'}
                    </p>

                    <div className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-neutral-500 dark:text-slate-500 uppercase tracking-wider mb-2">Room Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    placeholder="e.g. Unit 01 / Master Room"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 dark:text-slate-500 uppercase tracking-wider mb-2">Type</label>
                                <select name="type" value={formData.type} onChange={handleChange} className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                                    {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 dark:text-slate-500 uppercase tracking-wider mb-2">Booking Mode</label>
                                <select name="occupancyMode" value={formData.occupancyMode} onChange={handleChange} className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                                    {OCCUPANCY_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 dark:text-slate-500 uppercase tracking-wider mb-2">Monthly Rent (LKR)</label>
                                <input type="number" name="price" value={formData.price} onChange={handleChange} className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white font-mono" placeholder="0" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 dark:text-slate-500 uppercase tracking-wider mb-2">Capacity / Beds</label>
                                <div className="relative">
                                    <BedDouble size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                    <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white pl-10" min="1" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-neutral-500 dark:text-slate-500 uppercase tracking-wider mb-2">Bathroom Type</label>
                            <select name="features.bathroomType" value={formData.features?.bathroomType} onChange={handleChange} className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                                <option>Shared</option>
                                <option>Attached</option>
                            </select>
                        </div>

                        {/* Photo Upload */}
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 dark:text-slate-500 uppercase tracking-wider mb-3 flex justify-between">
                                <span>Room Photos ({formData.images?.length || 0}/3)</span>
                            </label>

                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {formData.images?.map((img, idx) => (
                                    <div key={idx} className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden border border-neutral-200 dark:border-slate-700 group shadow-sm">
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-1 right-1 bg-white/90 dark:bg-slate-800/90 text-red-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                                {(formData.images?.length || 0) < 3 && (
                                    <div className="relative w-24 h-24 flex-shrink-0 border-2 border-dashed border-neutral-300 dark:border-slate-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-slate-800 hover:border-primary transition-all flex flex-col items-center justify-center cursor-pointer">
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
                                                <Camera size={20} className="text-neutral-400 dark:text-slate-600 mb-1" />
                                                <span className="text-[10px] text-neutral-500 dark:text-slate-500 font-bold">Add Photo</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-neutral-100 dark:border-slate-800 flex justify-end gap-3 bg-neutral-50/50 dark:bg-slate-800/30">
                    <button onClick={onClose} className="px-6 py-2.5 text-neutral-600 dark:text-slate-400 font-bold hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                    <button
                        onClick={handleSave}
                        disabled={uploading || isSaving}
                        className="btn-primary px-8 py-2.5 shadow-lg shadow-primary/20"
                    >
                        {isSaving ? (
                            <div className="flex items-center gap-2">
                                <Loader size={18} className="animate-spin" />
                                <span>Saving...</span>
                            </div>
                        ) : 'Save Room'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoomFormModal;
