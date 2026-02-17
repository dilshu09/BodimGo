import { useState, useEffect } from 'react';
import { Clock, Shield, Users, Utensils, Zap, Music, Sparkles, AlertTriangle, Info, FileText } from 'lucide-react';
import api from '../../services/api';

const Toggle = ({ label, checked, onChange, subLabel }) => (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-neutral-100 dark:border-slate-700 rounded-2xl hover:border-primary/20 dark:hover:border-primary/20 transition-all group">
        <div>
            <span className="font-semibold text-neutral-700 dark:text-white group-hover:text-neutral-900 dark:group-hover:text-neutral-200 transition-colors">{label}</span>
            {subLabel && <p className="text-xs text-neutral-400 dark:text-slate-400 mt-0.5">{subLabel}</p>}
        </div>
        <button
            onClick={() => onChange(!checked)}
            className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors duration-300 ${checked ? 'bg-primary' : 'bg-neutral-200 dark:bg-slate-600'
                }`}
        >
            <div
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'
                    }`}
            />
        </button>
    </div>
);

const ModernSelect = ({ label, value, onChange, options }) => (
    <div className="bg-neutral-50 dark:bg-slate-800 p-4 rounded-xl border border-neutral-100 dark:border-slate-700">
        <label className="text-xs font-bold text-neutral-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white dark:bg-slate-700 border-0 rounded-lg p-2.5 text-neutral-700 dark:text-white font-medium focus:ring-2 focus:ring-primary/20 shadow-sm"
        >
            {options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
            ))}
        </select>
    </div>
);

const TimeInput = ({ label, value, onChange }) => (
    <div className="bg-neutral-50 dark:bg-slate-800 p-4 rounded-xl border border-neutral-100 dark:border-slate-700">
        <label className="text-xs font-bold text-neutral-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">{label}</label>
        <input
            type="time"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white dark:bg-slate-700 border-0 rounded-lg p-2 text-neutral-700 dark:text-white font-medium focus:ring-2 focus:ring-primary/20 shadow-sm"
        />
    </div>
);

const RuleSection = ({ icon: Icon, title, children }) => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-neutral-100 dark:border-slate-700 overflow-hidden mb-6">
        <div className="bg-neutral-50/50 dark:bg-slate-700/50 p-4 border-b border-neutral-100 dark:border-slate-700 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Icon size={16} />
            </div>
            <h4 className="font-bold text-neutral-800 dark:text-white">{title}</h4>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {children}
        </div>
    </div>
);

const StepHouseRules = ({ data, update }) => {
    const updateRule = (category, field, value) => {
        update({
            rules: {
                ...data.rules,
                [category]: {
                    ...data.rules?.[category],
                    [field]: value
                }
            }
        });
    };

    const [templates, setTemplates] = useState([]);
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const res = await api.get('/agreements/templates');
                if (res.data.success) {
                    setTemplates(res.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch templates", error);
            }
        };
        fetchTemplates();
    }, []);

    const rules = data.rules || {};

    return (
        <div className="animate-fade-in space-y-6">
            <div className="mb-6">
                <h3 className="font-bold text-xl text-neutral-800 dark:text-white">House Rules & Policies</h3>
                <p className="text-neutral-500 dark:text-slate-400 text-sm">Set clear expectations for your tenants.</p>
            </div>

            {/* 1. Visitors */}
            <RuleSection icon={Users} title="Visitors & Guests">
                <div className="col-span-2">
                    <Toggle
                        label="Visitors Allowed"
                        subLabel="Can tenants engage with guests?"
                        checked={rules.visitors?.allowed}
                        onChange={(val) => updateRule('visitors', 'allowed', val)}
                    />
                </div>
                {rules.visitors?.allowed && (
                    <>
                        <Toggle
                            label="Overnight Stay Allowed"
                            checked={rules.visitors?.overnightAllowed}
                            onChange={(val) => updateRule('visitors', 'overnightAllowed', val)}
                        />
                        <ModernSelect
                            label="Gender Restriction"
                            value={rules.visitors?.genderRestriction}
                            onChange={(val) => updateRule('visitors', 'genderRestriction', val)}
                            options={['Any', 'Same Gender Only', 'Couples Allowed', 'Family Only']}
                        />
                        <div className="col-span-2">
                            <ModernSelect
                                label="Visiting Hours"
                                value={rules.visitors?.visitingHours}
                                onChange={(val) => updateRule('visitors', 'visitingHours', val)}
                                options={['9 AM - 6 PM', '9 AM - 8 PM', '8 AM - 10 PM', '24/7', 'Weekends Only']}
                            />
                        </div>
                    </>
                )}
            </RuleSection>

            {/* 2. Cooking & Food */}
            <RuleSection icon={Utensils} title="Cooking & Food">
                <Toggle
                    label="Cooking Allowed"
                    checked={rules.cooking?.allowed}
                    onChange={(val) => updateRule('cooking', 'allowed', val)}
                />

                {rules.cooking?.allowed && (
                    <ModernSelect
                        label="Kitchen Access"
                        value={rules.cooking?.area}
                        onChange={(val) => updateRule('cooking', 'area', val)}
                        options={['Private Kitchen', 'Shared Kitchen', 'Light Cooking Only (In Room)']}
                    />
                )}

                <ModernSelect
                    label="Meals Provided"
                    value={rules.cooking?.mealsProvided}
                    onChange={(val) => updateRule('cooking', 'mealsProvided', val)}
                    options={['None', 'Breakfast Only', 'Dinner Only', 'All Meals', 'On Request']}
                />
            </RuleSection>

            {/* 3. Curfew & Timing */}
            <RuleSection icon={Clock} title="Curfew & Timing">
                <Toggle
                    label="Curfew Enabled"
                    subLabel="Gates close at a specific time?"
                    checked={rules.curfew?.enabled}
                    onChange={(val) => updateRule('curfew', 'enabled', val)}
                />

                {rules.curfew?.enabled && (
                    <div className="col-span-2 grid grid-cols-2 gap-4">
                        <TimeInput
                            label="Gates Close At"
                            value={rules.curfew?.time}
                            onChange={(val) => updateRule('curfew', 'time', val)}
                        />
                        <Toggle
                            label="Grace Period / Late Key"
                            subLabel="Can enter with key?"
                            checked={rules.curfew?.lateEntryAllowed}
                            onChange={(val) => updateRule('curfew', 'lateEntryAllowed', val)}
                        />
                    </div>
                )}
            </RuleSection>

            {/* 4. Lifestyle */}
            <RuleSection icon={Sparkles} title="Lifestyle Policies">
                <Toggle
                    label="Smoking Allowed"
                    checked={rules.substances?.smokingAllowed}
                    onChange={(val) => updateRule('substances', 'smokingAllowed', val)}
                />
                <Toggle
                    label="Alcohol Allowed"
                    checked={rules.substances?.alcoholAllowed}
                    onChange={(val) => updateRule('substances', 'alcoholAllowed', val)}
                />
                <Toggle
                    label="Pets Allowed"
                    checked={rules.pets?.allowed}
                    onChange={(val) => updateRule('pets', 'allowed', val)}
                />
                <Toggle
                    label="Loud Music / Parties"
                    checked={rules.noise?.loudMusicAllowed}
                    onChange={(val) => updateRule('noise', 'loudMusicAllowed', val)}
                />
            </RuleSection>

            {/* 5. Agreement Template */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-neutral-100 dark:border-slate-700 overflow-hidden mb-6">
                <div className="bg-neutral-50/50 dark:bg-slate-700/50 p-4 border-b border-neutral-100 dark:border-slate-700 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <FileText size={16} />
                    </div>
                    <h4 className="font-bold text-neutral-800 dark:text-white">Rental Agreement</h4>
                </div>
                <div className="p-5">
                    <p className="text-sm text-neutral-500 dark:text-slate-400 mb-4">Select the agreement template that tenants must accept before booking.</p>
                    <div className="bg-neutral-50 dark:bg-slate-900 p-4 rounded-xl border border-neutral-100 dark:border-slate-700">
                        <label className="text-xs font-bold text-neutral-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">Agreement Template</label>
                        <select
                            value={data.agreementTemplate || ""}
                            onChange={(e) => update({ agreementTemplate: e.target.value || null })}
                            className="w-full bg-white dark:bg-slate-800 border-0 rounded-lg p-2.5 text-neutral-700 dark:text-white font-medium focus:ring-2 focus:ring-primary/20 shadow-sm"
                        >
                            <option value="">Default (Standard Terms)</option>
                            {templates.map(t => (
                                <option key={t._id} value={t._id}>{t.name}</option>
                            ))}
                        </select>
                        <div className="mt-2 text-xs text-neutral-400 dark:text-slate-500">
                            {data.agreementTemplate ? "Tenants will see your custom terms." : "Tenants will see standard platform terms."}
                        </div>
                    </div>
                </div>
            </div>

            {/* 6. Additional Notes */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-neutral-100 dark:border-slate-700 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Info size={18} className="text-neutral-400 dark:text-slate-400" />
                    <h4 className="font-bold text-neutral-800 dark:text-white">Additional Instructions</h4>
                </div>
                <textarea
                    className="w-full bg-neutral-50 dark:bg-slate-900 border-0 rounded-xl p-4 text-sm text-neutral-800 dark:text-white focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                    placeholder="Any other specific rules? (e.g., 'Turn off lights when leaving', 'No shoes inside')"
                    value={rules.additionalNotes}
                    onChange={(e) => update({ rules: { ...rules, additionalNotes: e.target.value } })}
                />
            </div>
        </div>
    );
};

export default StepHouseRules;
