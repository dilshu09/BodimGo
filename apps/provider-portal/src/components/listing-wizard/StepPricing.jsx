import { Banknote, Zap, Calendar, Info } from 'lucide-react';

const StepPricing = ({ data, update }) => {
    const { pricingDefaults } = data;

    const handlePriceChange = (field, value) => {
        update({
            pricingDefaults: { ...pricingDefaults, [field]: value }
        });
    };

    const handleNestedChange = (parent, field, value) => {
        update({
            pricingDefaults: {
                ...pricingDefaults,
                [parent]: { ...pricingDefaults[parent], [field]: value }
            }
        });
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <h3 className="font-bold text-xl text-neutral-800 dark:text-white">Pricing & Utilities</h3>

            {/* Rent Model */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Rent Model</label>
                    <div className="flex gap-4">
                        {['Per Room', 'Per Bed'].map(mode => (
                            <label key={mode} className={`
                                flex-1 border rounded-xl p-4 cursor-pointer transition-all
                                ${pricingDefaults.rentModel === mode ? 'border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary' : 'border-neutral-200 dark:border-slate-700 hover:border-neutral-300 dark:hover:border-slate-600'}
                            `}>
                                <input
                                    type="radio"
                                    name="rentModel"
                                    className="hidden"
                                    checked={pricingDefaults.rentModel === mode}
                                    onChange={() => handlePriceChange('rentModel', mode)}
                                />
                                <div className="font-bold text-neutral-800 dark:text-white">{mode}</div>
                                <div className="text-xs text-neutral-500 dark:text-slate-400 mt-1">
                                    {mode === 'Per Room' ? 'Charge for the entire room' : 'Charge per individual bed'}
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Billing Cycle</label>
                    <select
                        value={pricingDefaults.billingCycle}
                        onChange={(e) => handlePriceChange('billingCycle', e.target.value)}
                        className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    >
                        <option>Monthly</option>
                        <option>Weekly</option>
                        <option>Daily</option>
                        <option>Per Semester</option>
                    </select>
                </div>
            </div>

            {/* Deposit */}
            <div className="bg-neutral-50 dark:bg-slate-800 p-6 rounded-2xl border border-neutral-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-4">
                    <Banknote className="text-primary" size={20} />
                    <h4 className="font-bold text-neutral-800 dark:text-white">Security Deposit</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Deposit Amount (LKR)</label>
                        <input
                            type="number"
                            value={pricingDefaults.deposit?.amount}
                            onChange={(e) => handleNestedChange('deposit', 'amount', Number(e.target.value))}
                            placeholder="0"
                            className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Refund Policy</label>
                        <select
                            value={pricingDefaults.deposit?.refundable ? 'Refundable' : 'Non-Refundable'}
                            onChange={(e) => handleNestedChange('deposit', 'refundable', e.target.value === 'Refundable')}
                            className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        >
                            <option value="Refundable">Refundable</option>
                            <option value="Non-Refundable">Non-Refundable</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Utilities */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Zap className="text-yellow-500" size={20} />
                    <h4 className="font-bold text-neutral-800">Utilities & Bills</h4>
                </div>

                {/* Bills Policy (Required Field) */}
                <div className="mb-4">
                    <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">General Bills Policy</label>
                    <select
                        value={pricingDefaults.billsPolicy || 'Included'}
                        onChange={(e) => handlePriceChange('billsPolicy', e.target.value)}
                        className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    >
                        <option value="Included">All Included in Rent</option>
                        <option value="Separate">Charged Separately</option>
                        <option value="Partially Included">Partially Included</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.keys(pricingDefaults.utilities).map(util => (
                        <div key={util} className="bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-xl p-4">
                            <label className="block text-xs font-bold text-neutral-500 dark:text-slate-400 uppercase mb-2 capitalize">{util}</label>
                            <select
                                value={pricingDefaults.utilities[util]}
                                onChange={(e) => handleNestedChange('utilities', util, e.target.value)}
                                className="w-full text-sm font-semibold text-neutral-700 dark:text-white bg-transparent outline-none cursor-pointer"
                            >
                                <option className="dark:bg-slate-800">Included</option>
                                <option className="dark:bg-slate-800">Metered</option>
                                <option className="dark:bg-slate-800">Shared Split</option>
                                <option className="dark:bg-slate-800">Not Available</option>
                                {util === 'wifi' && <option className="dark:bg-slate-800">Optional Extra</option>}
                            </select>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-xl text-blue-700 text-sm">
                <Info size={18} className="mt-0.5 flex-shrink-0" />
                <p>These settings are defaults. You can override pricing for specific rooms in the "Room Details" step later.</p>
            </div>
        </div>
    );
};
export default StepPricing;
