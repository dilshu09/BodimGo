import { Upload, X, Camera, AlertOctagon, CheckCircle2, CloudLightning, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const StepImages = ({ data, update, errors, verified }) => {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        const tId = toast.loading(`Processing ${files.length} photo(s)...`);

        // 1. Create Optimistic Previews (Blobs)
        const optimisticImages = files.map(file => ({
            file,
            preview: URL.createObjectURL(file), // Immediate feedback
            status: 'uploading'
        }));

        // Append optimistic images to current state (temporarily)
        // Note: data.images is usually array of strings. We need to handle this hybrid state.
        // Strategy: We won't modify data.images yet. We perform the upload, then update data.images.
        // BUT to show preview, we need local state.
        // Actually, cleaner approach: Just Upload quickly.
        // User asked for preview. Let's do the "Upload then Show" but assuming URL works.
        // If we want "Instant", we need a separate local state for "pending uploads".

        // Let's stick to the robust flow but with better feedback since I fixed the URL issue.
        // Implementing complex optimistic UI might introduce bugs with the Wizard state (which expects strings).

        try {
            const newUrls = [];
            let successCount = 0;

            for (const file of files) {
                // Client-side pre-check
                if (file.size > 10 * 1024 * 1024) {
                    toast.error(`Skipped ${file.name}: Too large (>10MB)`, { id: tId });
                    continue;
                }

                const fData = new FormData();
                fData.append('image', file);

                try {
                    const res = await api.post('/upload', fData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });

                    if (res.data?.url) {
                        newUrls.push(res.data.url);
                        successCount++;
                    }
                } catch (innerErr) {
                    console.error("Single Upload Fail:", innerErr);
                }
            }

            if (newUrls.length > 0) {
                update({
                    images: [...(data.images || []), ...newUrls]
                });
                toast.success(`Uploaded ${successCount} photos!`, { id: tId });
            } else if (successCount === 0) {
                toast.error("Upload failed. Please check your connection.", { id: tId });
            }

        } catch (err) {
            console.error("Batch Upload Error:", err);
            toast.error("Upload process encountered an error.", { id: tId });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeImage = (index) => {
        const newImages = data.images.filter((_, i) => i !== index);
        update({ images: newImages });
    };

    return (
        <div className="space-y-6 animate-fade-in min-h-[400px]">
            <div className="text-center mb-6">
                <h3 className="font-bold text-xl text-neutral-800">Property Photos</h3>
                <p className="text-neutral-500 text-sm">Upload high-quality photos to attract more tenants.</p>
            </div>

            {/* Verification Success */}
            {verified && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2 mb-6">
                    <CheckCircle2 size={20} />
                    <span className="font-semibold">All photos verified & approved by AI!</span>
                </div>
            )}

            {/* Verification Failures */}
            {errors?.flaggedImages?.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
                        <AlertOctagon size={18} />
                        <h4>Photos Removed by AI Protection</h4>
                    </div>
                    <ul className="list-disc list-inside text-sm text-red-600 space-y-1 ml-1">
                        {errors.flaggedImages.map((flag, idx) => (
                            <li key={idx}>
                                <span className="font-medium">Image {idx + 1}:</span> {flag.reason}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Upload Area */}
            <div className={`
                border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer relative transition-all duration-300
                ${uploading ? 'bg-neutral-50 border-primary/50' : 'border-neutral-300 hover:bg-neutral-50 hover:border-primary'}
            `}>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait"
                    disabled={uploading}
                />
                <div className="flex flex-col items-center gap-3">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${uploading ? 'bg-primary/20 text-primary animate-pulse' : 'bg-primary/10 text-primary'}`}>
                        {uploading ? <Loader2 size={28} className="animate-spin" /> : <CloudLightning size={28} />}
                    </div>
                    <div>
                        <span className="font-bold text-primary text-lg block">{uploading ? 'Uploading Photos...' : 'Click to Upload Photos'}</span>
                        <span className="text-neutral-500 text-sm">Supports JPG, PNG (Max 10MB)</span>
                    </div>
                    {!uploading && <p className="text-xs text-neutral-400 mt-2">AI checks will apply after you click "Verify"</p>}
                </div>
            </div>

            {/* Image Grid */}
            {data.images?.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
                    {data.images.map((img, index) => (
                        <div key={index} className="relative group rounded-xl overflow-hidden aspect-square border border-neutral-200 bg-neutral-100 shadow-sm hover:shadow-md transition-shadow">
                            <img
                                src={img}
                                alt={`Prop-${index}`}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                                onError={(e) => { e.target.src = 'https://placehold.co/400x400?text=Broken+Image'; }}
                            />

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

                            {/* Remove Button */}
                            <button
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 p-1.5 bg-white text-red-500 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform scale-90 group-hover:scale-100 hover:bg-red-50"
                                title="Remove photo"
                            >
                                <X size={14} strokeWidth={3} />
                            </button>

                            {/* Badge (if verified) */}
                            {verified && (
                                <div className="absolute bottom-2 right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm flex items-center gap-1">
                                    <CheckCircle2 size={10} /> Safe
                                </div>
                            )}

                            {/* Index Badge */}
                            <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-md font-medium backdrop-blur-sm">
                                #{index + 1}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
export default StepImages;
