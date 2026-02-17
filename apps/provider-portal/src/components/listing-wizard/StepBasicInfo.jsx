import { AlertCircle, CheckCircle2 } from 'lucide-react';

const StepBasicInfo = ({ data, update, errors, verified }) => {

    const handleChange = (e) => {
        const { name, value } = e.target;
        update({ [name]: value });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {verified && (
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl flex items-center gap-2 mb-6">
                    <CheckCircle2 size={20} />
                    <span className="font-semibold">Details verified with AI Agents. You can proceed.</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                    <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Property Title</label>
                    <div className="relative">
                        <input
                            type="text"
                            name="title"
                            value={data.title}
                            onChange={handleChange}
                            className={`input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white pr-10 ${errors?.title ? 'border-red-500 focus:ring-red-200' : (verified ? 'border-green-500' : '')}`}
                            placeholder="e.g. Spacious Annex in Kaduwela"
                            maxLength={60}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {verified && <CheckCircle2 className="text-green-500" size={18} />}
                            {errors?.title && <AlertCircle className="text-red-500" size={18} />}
                        </div>
                    </div>
                    {errors?.title && (
                        <p className="text-xs text-red-500 mt-1 font-medium">{errors.title}</p>
                    )}
                    <p className="text-xs text-neutral-400 dark:text-slate-500 mt-1">Make it catchy! Min 10 characters.</p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Property Type</label>
                    <select name="type" value={data.type} onChange={handleChange} className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                        <option>Annex</option>
                        <option>Single Room</option>
                        <option>House</option>
                        <option>Hostel</option>
                        <option>Apartment</option>
                        <option>Shared House</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Gender Policy</label>
                    <select name="genderPolicy" value={data.genderPolicy} onChange={handleChange} className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                        <option>Mixed</option>
                        <option>Girls only</option>
                        <option>Boys only</option>
                    </select>
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Description</label>
                    <div className="relative">
                        <textarea
                            name="description"
                            value={data.description}
                            onChange={handleChange}
                            rows={5}
                            className={`input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white ${errors?.description ? 'border-red-500 focus:ring-red-200' : (verified ? 'border-green-500' : '')}`}
                            placeholder="Describe the property, atmosphere, and nearby places..."
                        />
                        <div className="absolute right-3 top-3">
                            {verified && <CheckCircle2 className="text-green-500" size={18} />}
                            {errors?.description && <AlertCircle className="text-red-500" size={18} />}
                        </div>
                    </div>
                    {errors?.description && (
                        <p className="text-xs text-red-500 mt-1 font-medium">{errors.description}</p>
                    )}
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-lg flex gap-2">
                        <span>💡</span>
                        <p>Our AI automatically scans for clarity, safety, and privacy (no phone numbers allowed here).</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default StepBasicInfo;
