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
            <h3 className="font-bold text-xl text-neutral-800">Pricing & Utilities</h3>

            {/* Rent Model */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-2">Rent Model</label>
                    <div className="flex gap-4">
                        {['Per Room', 'Per Bed'].map(mode => (
                            <label key={mode} className={`
                                flex-1 border rounded-xl p-4 cursor-pointer transition-all
                                ${pricingDefaults.rentModel === mode ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-neutral-200 hover:border-neutral-300'}
                            `}>
                                <input
                                    type="radio"
                                    name="rentModel"
                                    className="hidden"
                                    checked={pricingDefaults.rentModel === mode}
                                    onChange={() => handlePriceChange('rentModel', mode)}
                                />
                                <div className="font-bold text-neutral-800">{mode}</div>
                                <div className="text-xs text-neutral-500 mt-1">
                                    {mode === 'Per Room' ? 'Charge for the entire room' : 'Charge per individual bed'}
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-2">Billing Cycle</label>
                    <select
                        value={pricingDefaults.billingCycle}
                        onChange={(e) => handlePriceChange('billingCycle', e.target.value)}
                        className="input-field"
                    >
                        <option>Monthly</option>
                        <option>Weekly</option>
                        <option>Daily</option>
                        <option>Per Semester</option>
                    </select>
                </div>
            </div>

            {/* Deposit */}
            <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-200">
                <div className="flex items-center gap-2 mb-4">
                    <Banknote className="text-primary" size={20} />
                    <h4 className="font-bold text-neutral-800">Security Deposit</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">Deposit Amount (LKR)</label>
                        <input
                            type="number"
                            value={pricingDefaults.deposit?.amount}
                            onChange={(e) => handleNestedChange('deposit', 'amount', Number(e.target.value))}
                            placeholder="0"
                            className="input-field font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">Refund Policy</label>
                        <select
                            value={pricingDefaults.deposit?.refundable ? 'Refundable' : 'Non-Refundable'}
                            onChange={(e) => handleNestedChange('deposit', 'refundable', e.target.value === 'Refundable')}
                            className="input-field"
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
                    <label className="block text-sm font-bold text-neutral-700 mb-2">General Bills Policy</label>
                    <select
                        value={pricingDefaults.billsPolicy || 'Included'}
                        onChange={(e) => handlePriceChange('billsPolicy', e.target.value)}
                        className="input-field"
                    >
                        <option value="Included">All Included in Rent</option>
                        <option value="Separate">Charged Separately</option>
                        <option value="Partially Included">Partially Included</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.keys(pricingDefaults.utilities).map(util => (
                        <div key={util} className="bg-white border border-neutral-200 rounded-xl p-4">
                            <label className="block text-xs font-bold text-neutral-500 uppercase mb-2 capitalize">{util}</label>
                            <select
                                value={pricingDefaults.utilities[util]}
                                onChange={(e) => handleNestedChange('utilities', util, e.target.value)}
                                className="w-full text-sm font-semibold text-neutral-700 bg-transparent outline-none cursor-pointer"
                            >
                                <option>Included</option>
                                <option>Metered</option>
                                <option>Shared Split</option>
                                <option>Not Available</option>
                                {util === 'wifi' && <option>Optional Extra</option>}
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
