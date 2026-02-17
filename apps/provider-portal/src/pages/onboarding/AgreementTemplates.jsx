import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Plus, Clock, Edit2, Loader, X, Eye, ShieldCheck, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown'; // Optional: Use if markdown content is expected

const AgreementTemplates = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await api.get('/agreements/templates');
            if (res.data.success) {
                setTemplates(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch templates", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-800 dark:text-white">Agreements</h1>
                    <p className="text-neutral-500 dark:text-slate-400">Manage rental agreement templates.</p>
                </div>
                <button
                    onClick={() => navigate('/agreements/new')}
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-colors"
                >
                    <Plus size={18} /> New Template
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Default Template Card */}


                {/* Custom Templates */}
                {templates.map(template => (
                    <div key={template._id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-neutral-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group relative">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button className="p-2 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-lg text-neutral-500 dark:text-slate-400">
                                <Edit2 size={16} />
                            </button>
                            <button className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-red-500">
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary">
                            <FileText size={20} />
                        </div>
                        <h3 className="font-bold text-lg text-neutral-800 dark:text-white mb-1">{template.name}</h3>
                        <p className="text-neutral-500 dark:text-slate-400 text-sm mb-6 line-clamp-2">Custom agreement for specific properties.</p>

                        <div className="flex items-center gap-2 text-xs text-neutral-400 dark:text-slate-500 mb-4">
                            <span>Last edited: {template.createdAt && formatDistanceToNow(new Date(template.createdAt), { addSuffix: true })}</span>
                        </div>

                        <button
                            onClick={() => setSelectedTemplate(template)}
                            className="w-full py-2 border border-neutral-200 dark:border-slate-700 hover:border-primary text-neutral-600 dark:text-slate-300 hover:text-primary rounded-lg text-sm font-semibold transition-colors"
                        >
                            View Details
                        </button>
                    </div>
                ))}
            </div>

            {/* Preview Modal */}
            {selectedTemplate && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl border border-neutral-200 dark:border-slate-800">
                        <div className="p-6 border-b border-neutral-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-neutral-800 dark:text-white">{selectedTemplate.name}</h2>
                                <p className="text-sm text-neutral-500 dark:text-slate-400">Preview Mode</p>
                            </div>
                            <button
                                onClick={() => setSelectedTemplate(null)}
                                className="p-2 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-full text-neutral-500 dark:text-slate-400"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto flex-1 bg-neutral-50 dark:bg-slate-900/50 font-serif text-neutral-800 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                            {selectedTemplate.content}
                            <p className="mt-4 italic text-neutral-400 dark:text-slate-500 text-sm">[...Full legal document content...]</p>
                        </div>
                        <div className="p-4 border-t border-neutral-100 dark:border-slate-800 flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedTemplate(null)}
                                className="px-4 py-2 text-neutral-600 dark:text-slate-300 font-semibold hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-lg"
                            >
                                Close Preview
                            </button>
                            <button className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark">
                                Use This Template
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgreementTemplates;
