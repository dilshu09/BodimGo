import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, FileText, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const AgreementBuilder = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Check if editing
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [fetching, setFetching] = useState(isEditMode);
    const [aiPrompt, setAiPrompt] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        lockPeriod: '6',
        noticePeriod: '1',
        content: ''
    });

    useEffect(() => {
        if (isEditMode) {
            fetchTemplate();
        }
    }, [id]);

    const fetchTemplate = async () => {
        try {
            const res = await api.get(`/agreements/templates/${id}`);
            if (res.data.success) {
                const { name, lockPeriod, noticePeriod, content } = res.data.data;
                setFormData({ name, lockPeriod, noticePeriod, content });
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load template");
            navigate('/agreements');
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAIGenerate = async () => {
        if (!aiPrompt.trim()) {
            toast.error("Please enter instructions for the AI.");
            return;
        }

        try {
            setGenerating(true);
            const res = await api.post('/ai/generate-agreement', { prompt: aiPrompt });
            if (res.data.success) {
                setFormData(prev => ({ ...prev, content: res.data.text }));
                toast.success("Draft generated! Please review.");
            }
        } catch (error) {
            console.error(error);
            toast.error("AI Generation failed. Try again.");
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.content) {
            toast.error('Please fill in required fields');
            return;
        }

        try {
            setLoading(true);
            if (isEditMode) {
                await api.put(`/agreements/templates/${id}`, formData);
                toast.success('Template updated successfully');
            } else {
                await api.post('/agreements/templates', formData);
                toast.success('Template created successfully');
            }
            navigate('/agreements');
        } catch (error) {
            console.error(error);
            toast.error('Failed to save template');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate('/agreements')} className="p-2 hover:bg-neutral-200 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-neutral-600" />
                    </button>
                    <h1 className="text-2xl font-bold text-neutral-800">
                        {isEditMode ? 'Edit Agreement Template' : 'Create New Agreement'}
                    </h1>
                </div>

                <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200">
                        <h2 className="text-lg font-bold text-neutral-800 mb-6">Template Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1">
                                <label className="block text-sm font-bold text-neutral-700 mb-2">Template Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    placeholder="e.g. Standard 6-Month Lease"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-neutral-700 mb-2">Lock Period (Months)</label>
                                <input
                                    type="number"
                                    name="lockPeriod"
                                    value={formData.lockPeriod}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-neutral-700 mb-2">Notice (Months)</label>
                                <input
                                    type="number"
                                    name="noticePeriod"
                                    value={formData.noticePeriod}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Terms & Conditions (AI Powered) */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-neutral-800">Terms & Conditions</h2>
                            <div className="bg-purple-50 px-3 py-1 rounded-full text-xs font-bold text-purple-600 flex items-center gap-1 border border-purple-100">
                                <Sparkles size={14} />
                                <span>AI Assistant Enabled</span>
                            </div>
                        </div>

                        {/* AI Input Area */}
                        <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 mb-4 transition-all focus-within:ring-2 focus-within:ring-purple-100">
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                                Ask AI to draft terms
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder="e.g. Write a strict agreement for students, no loud music, no visitors after 10PM, rent due on 5th..."
                                    className="flex-1 bg-white border border-neutral-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAIGenerate()}
                                />
                                <button
                                    onClick={handleAIGenerate}
                                    disabled={generating}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2 min-w-[120px] justify-center"
                                >
                                    {generating ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Drafting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={16} />
                                            <span>Generate</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="relative">
                            <FileText className="absolute top-4 left-4 text-neutral-400" size={20} />
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                className="w-full p-4 pl-12 bg-white border border-neutral-200 rounded-xl h-96 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-y font-mono text-sm leading-relaxed"
                                placeholder="Agreement terms will appear here..."
                            />
                        </div>
                        <p className="mt-2 text-xs text-neutral-500">
                            Review the generated content carefully before saving.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-4 pt-4">
                        <button
                            onClick={() => navigate('/agreements')}
                            className="px-6 py-3 text-neutral-600 font-bold hover:bg-neutral-100 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex items-center gap-2 px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={20} />
                            {loading ? 'Saving...' : (isEditMode ? 'Update Template' : 'Save Template')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgreementBuilder;
