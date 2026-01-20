import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Plus, Clock, Edit2, Loader, X, Eye } from 'lucide-react';
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
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-800">Agreement Templates</h1>
                    <p className="text-neutral-500 mt-1">Define the legal terms for your properties.</p>
                </div>
                <Link to="/agreements/new" className="btn-primary flex items-center gap-2">
                    <Plus size={18} />
                    New Template
                </Link>
            </div>

            {templates.length === 0 ? (
                <div className="text-center py-20 bg-neutral-50 rounded-2xl border border-dashed border-neutral-300">
                    <div className="bg-white p-4 rounded-full shadow-sm inline-block mb-4">
                        <FileText size={32} className="text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-bold text-neutral-700">No Templates Yet</h3>
                    <p className="text-neutral-500 mb-6">Create your first rental agreement template to get started.</p>
                    <Link to="/agreements/new" className="btn-primary inline-flex items-center gap-2">
                        <Plus size={18} /> Create Template
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {templates.map(tpl => (
                        <div key={tpl._id} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow relative group/card">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                    <FileText size={24} />
                                </div>
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                    Active
                                </span>
                            </div>
                            <h3 className="font-bold text-lg mb-1">{tpl.name}</h3>
                            <div className="flex items-center gap-4 text-xs text-neutral-500 mb-6">
                                <span className="px-2 py-0.5 bg-neutral-100 rounded text-neutral-600">{tpl.lockPeriod}M Lock-in</span>
                                {tpl.createdAt && (
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} /> {formatDistanceToNow(new Date(tpl.createdAt), { addSuffix: true })}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-neutral-100">
                                <button
                                    onClick={() => setSelectedTemplate(tpl)}
                                    className="flex-1 py-2.5 px-4 bg-white border border-neutral-200 text-neutral-700 font-bold rounded-xl hover:bg-neutral-50 hover:border-neutral-300 transition-all text-sm shadow-sm flex items-center justify-center gap-2"
                                >
                                    <Eye size={16} className="text-neutral-400" />
                                    Preview Terms
                                </button>
                                <button
                                    onClick={() => navigate(`/agreements/edit/${tpl._id}`)}
                                    className="p-2.5 bg-neutral-50 text-neutral-600 rounded-xl hover:bg-white hover:text-primary hover:shadow-md border border-transparent hover:border-neutral-100 transition-all group"
                                >
                                    <Edit2 size={18} className="group-hover:scale-110 transition-transform" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Preview Modal */}
            {selectedTemplate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-neutral-100">
                            <div>
                                <h2 className="text-xl font-bold text-neutral-800">{selectedTemplate.name}</h2>
                                <p className="text-sm text-neutral-500">Previewing agreement terms</p>
                            </div>
                            <button
                                onClick={() => setSelectedTemplate(null)}
                                className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
                            >
                                <X size={20} className="text-neutral-500" />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto custom-scrollbar bg-neutral-50/50">
                            <div className="prose prose-sm max-w-none text-neutral-700 font-mono text-sm leading-relaxed bg-white p-8 rounded-xl border border-neutral-200 shadow-sm">
                                <ReactMarkdown>{selectedTemplate.content}</ReactMarkdown>
                            </div>
                        </div>
                        <div className="p-6 border-t border-neutral-100 flex justify-end gap-3 bg-white rounded-b-2xl">
                            <button
                                onClick={() => setSelectedTemplate(null)}
                                className="px-5 py-2.5 text-neutral-600 font-bold hover:bg-neutral-50 rounded-xl transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => navigate(`/agreements/edit/${selectedTemplate._id}`)}
                                className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 flex items-center gap-2"
                            >
                                <Edit2 size={16} /> Edit Template
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgreementTemplates;
