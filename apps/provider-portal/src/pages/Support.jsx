import React, { useState, useEffect } from 'react';
import { HelpCircle, MessageSquare, ChevronDown, ChevronUp, Send, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const FaqItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-neutral-200 dark:border-slate-800 rounded-xl overflow-hidden mb-3">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors text-left"
            >
                <span className="font-semibold text-neutral-800 dark:text-white">{question}</span>
                {isOpen ? <ChevronUp size={20} className="text-neutral-400 dark:text-slate-500" /> : <ChevronDown size={20} className="text-neutral-400 dark:text-slate-500" />}
            </button>
            {isOpen && (
                <div className="p-4 bg-neutral-50 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 text-sm border-t border-neutral-200 dark:border-slate-700">
                    {answer}
                </div>
            )}
        </div>
    );
};

const Support = () => {
    const [ticket, setTicket] = useState({
        subject: '',
        category: 'general',
        priority: 'medium',
        message: ''
    });
    const [sending, setSending] = useState(false);
    const [myTickets, setMyTickets] = useState([]);

    useEffect(() => {
        fetchMyTickets();
    }, []);

    const fetchMyTickets = async () => {
        try {
            const res = await api.get('/tickets');
            setMyTickets(res.data);
        } catch (error) {
            console.error("Failed to fetch my tickets", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!ticket.subject || !ticket.message) {
            toast.error('Please fill in all required fields');
            return;
        }

        setSending(true);
        try {
            await api.post('/tickets', {
                subject: ticket.subject,
                category: ticket.category,
                priority: ticket.priority,
                message: ticket.message
            });
            toast.success('Support ticket created successfully!');
            setTicket({ subject: '', category: 'general', priority: 'medium', message: '' });
            fetchMyTickets();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to submit ticket');
        } finally {
            setSending(false);
        }
    };

    const faqs = [
        {
            question: "I am facing a technical error or system bug.",
            answer: "If you experience crashes or data not saving, please verify your internet connection first. If the issue persists, submit a ticket with the 'Technical' category and include any error messages you see."
        },
        {
            question: "My listing was flagged/reported as fake.",
            answer: "We take reports seriously. Please submit a 'Legal' ticket with your property ownership documents (Deed/Utility Bill). If verified, the flag will be removed immediately."
        },
        {
            question: "How do I report a fake review or user?",
            answer: "Navigate to the user's profile or the review section and click the 'Report' flag icon. Our safety team investigates all reports within 24 hours."
        },
        {
            question: "Why was my account suspended?",
            answer: "Suspensions occur due to violations of our Terms of Service (e.g., fraudulent listings, harassment). Contact support with the 'Legal' priority to appeal this decision."
        }
    ];

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <HelpCircle size={32} className="text-primary" />
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Help & Support</h1>
                    <p className="text-neutral-500 dark:text-slate-400">Find answers or contact our support team</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: FAQs & My Tickets */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-neutral-200 dark:border-slate-800">
                        <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-6 flex items-center gap-2">
                            <FileText size={24} className="text-blue-500" />
                            Frequently Asked Questions
                        </h2>
                        <div className="space-y-1">
                            {faqs.map((faq, index) => (
                                <FaqItem key={index} {...faq} />
                            ))}
                        </div>
                    </div>

                    {/* My Tickets Section */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-neutral-200 dark:border-slate-800">
                        <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-6 flex items-center gap-2">
                            <MessageSquare size={24} className="text-purple-500" />
                            My Support Tickets
                        </h2>
                        <div className="space-y-4">
                            {myTickets.length === 0 && <p className="text-neutral-400 dark:text-slate-500 text-sm">No tickets found.</p>}
                            {myTickets.map(ticket => (
                                <div key={ticket._id} className="border border-neutral-100 dark:border-slate-800 rounded-xl p-4 hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-neutral-800 dark:text-white">{ticket.subject}</h3>
                                        <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${ticket.status === 'resolved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            ticket.status === 'open' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-neutral-100 text-neutral-600 dark:bg-slate-800 dark:text-slate-400'
                                            }`}>
                                            {ticket.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-neutral-500 dark:text-slate-400 mb-3">{ticket.message}</p>

                                    {ticket.adminResponse && (
                                        <div className="bg-neutral-100 dark:bg-slate-800 p-3 rounded-lg text-sm text-neutral-700 dark:text-slate-300 mt-3 border-l-4 border-purple-500">
                                            <span className="font-bold block text-xs text-purple-700 dark:text-purple-400 mb-1">Admin Response:</span>
                                            {ticket.adminResponse}
                                        </div>
                                    )}
                                    <div className="mt-2 text-xs text-neutral-400 dark:text-slate-500">
                                        Submitted on {new Date(ticket.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/20 flex items-start gap-4">
                        <AlertCircle className="text-blue-600 dark:text-blue-400 shrink-0" size={24} />
                        <div>
                            <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-1">Need urgent legal assistance?</h3>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                For legal disputes with tenants, please contact our dedicated legal hotline at <span className="font-mono font-bold">+94 11 234 5678</span> (Mon-Fri, 9am-5pm).
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Contact Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-neutral-200 dark:border-slate-800 sticky top-24">
                        <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-6 flex items-center gap-2">
                            <MessageSquare size={24} className="text-green-500" />
                            Contact Admin
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-neutral-700 dark:text-slate-300 mb-1">Subject</label>
                                <input
                                    type="text"
                                    value={ticket.subject}
                                    onChange={(e) => setTicket({ ...ticket, subject: e.target.value })}
                                    className="w-full p-3 bg-neutral-50 dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm dark:text-white"
                                    placeholder="e.g. Payment Issue"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-neutral-700 dark:text-slate-300 mb-1">Category</label>
                                    <select
                                        value={ticket.category}
                                        onChange={(e) => setTicket({ ...ticket, category: e.target.value })}
                                        className="w-full p-3 bg-neutral-50 dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm dark:text-white"
                                    >
                                        <option value="general">General</option>
                                        <option value="billing">Billing</option>
                                        <option value="technical">Technical</option>
                                        <option value="legal">Legal</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-neutral-700 dark:text-slate-300 mb-1">Priority</label>
                                    <select
                                        value={ticket.priority}
                                        onChange={(e) => setTicket({ ...ticket, priority: e.target.value })}
                                        className="w-full p-3 bg-neutral-50 dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm dark:text-white"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-neutral-700 dark:text-slate-300 mb-1">Message</label>
                                <textarea
                                    rows="5"
                                    value={ticket.message}
                                    onChange={(e) => setTicket({ ...ticket, message: e.target.value })}
                                    className="w-full p-3 bg-neutral-50 dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm resize-none dark:text-white"
                                    placeholder="Describe your issue in detail..."
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={sending}
                                className="w-full py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold rounded-xl hover:bg-neutral-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                            >
                                {sending ? 'Sending...' : (
                                    <>
                                        <Send size={18} /> Submit Ticket
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Support;
