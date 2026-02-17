import React, { useState, useEffect } from "react";
import {
    Bell,
    CheckCircle,
    Clock,
    Info,
    MessageSquare,
    Search,
    Filter,
    MoreVertical,
    Send
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";

const API_URL = "http://localhost:5000/api"; // Adjust if needed

export default function Inbox() {
    const [messages, setMessages] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [conversationMessages, setConversationMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);

    // Fetch conversations and tickets
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [convs, tickets] = await Promise.all([fetchConversations(), fetchTickets()]);
            const allMessages = [...convs, ...tickets].sort((a, b) => new Date(b.date) - new Date(a.date));
            setMessages(allMessages);
            setLoading(false);
        };
        fetchData();
    }, []);

    const fetchConversations = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/conversations`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            return res.data.map(conv => {
                const otherParticipant = conv.participants.find(p => p._id !== localStorage.getItem('userId')) || conv.participants[0];
                return {
                    id: conv._id,
                    sender: otherParticipant ? otherParticipant.name : 'Unknown',
                    senderDetails: otherParticipant,
                    subject: conv.contextListing ? conv.contextListing.title : 'General Inquiry',
                    preview: conv.lastMessageContent || 'No messages yet',
                    date: conv.updatedAt,
                    read: true,
                    type: 'inquiry',
                    participants: conv.participants
                };
            });
        } catch (error) {
            console.error("Error fetching conversations:", error);
            return [];
        }
    };

    const fetchTickets = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/tickets`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            return res.data.map(ticket => ({
                id: ticket._id,
                sender: 'Admin Support',
                senderDetails: { name: 'Admin Support', isSystem: true },
                subject: ticket.subject,
                preview: ticket.adminResponse || ticket.message,
                date: ticket.updatedAt || ticket.createdAt,
                read: ticket.status !== 'open', // simple logic
                type: 'ticket',
                originalTicket: ticket
            }));

        } catch (error) {
            console.error("Error fetching tickets:", error);
            return [];
        }
    };

    // Replace the initial simple fetchConversations call
    // ... we handled it in useEffect above.

    // Fetch messages when a conversation is selected
    useEffect(() => {
        if (selectedMessage) {
            if (selectedMessage.type === 'inquiry') {
                fetchMessages(selectedMessage.id);
            } else if (selectedMessage.type === 'ticket') {
                // For tickets, we don't fetch "messages" endpoint (it doesn't exist yet on backend like convs)
                // We construct a pseudo-chat history from the ticket object itself
                const ticket = selectedMessage.originalTicket;
                const history = [];

                // 1. Initial Message
                // If source is 'admin', it's an inbound message (left side)
                // If source is 'provider' (default), it's outbound (right side)
                const isFromAdmin = ticket.source === 'admin';

                history.push({
                    _id: 'initial',
                    sender: isFromAdmin ? { _id: 'admin', name: 'Admin Support' } : { _id: localStorage.getItem('userId'), name: 'Me' },
                    content: ticket.message,
                    createdAt: ticket.createdAt
                });

                // 2. Admin Response (if exists)
                if (ticket.adminResponse) {
                    history.push({
                        _id: 'response',
                        sender: { _id: 'admin', name: 'Admin Support' }, // Always Admin
                        content: ticket.adminResponse,
                        createdAt: ticket.respondedAt || ticket.updatedAt
                    });
                }
                setConversationMessages(history);
            }
        }
    }, [selectedMessage]);

    const fetchMessages = async (conversationId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/conversations/${conversationId}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConversationMessages(res.data);
        } catch (error) {
            console.error("Error fetching messages:", error);
            toast.error("Failed to load conversation history");
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedMessage) return;

        try {
            const token = localStorage.getItem('token');

            if (selectedMessage.type === 'ticket') {
                // Reply to ticket -> Currently backend Ticket only supports 1 response?
                // Or we can just create a NEW ticket referencing the old one?
                // For now, let's just toast that this is a read-only view until full chat is implemented
                // OR better: Create a new ticket as a "Reply"?
                // Let's implement full chat later. For now, enable sending "Follow-up" ticket.

                // For this task, user wants to SEE the message. Replying might be out of scope or complex.
                // Let's allow users to send a NEW message in this thread context manually (simulated)
                // Actually, let's just alert them.
                toast("Replies to tickets will clearly open a new support thread soon. Feature in progress!");
                return;
            }

            const res = await axios.post(`${API_URL}/conversations/${selectedMessage.id}/messages`,
                { content: newMessage },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Add new message to list
            setConversationMessages([...conversationMessages, res.data]);
            setNewMessage("");

            // Update last message in sidebar list
            setMessages(prev => prev.map(msg =>
                msg.id === selectedMessage.id
                    ? { ...msg, preview: newMessage, date: new Date().toISOString() }
                    : msg
            ));

        } catch (error) {
            console.error("Error sending message:", error);
            toast.error("Failed to send message");
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case "booking": return <Clock className="text-blue-500" />;
            case "approval": return <CheckCircle className="text-green-500" />;
            case "payment": return <Info className="text-purple-500" />;
            case "maintenance": return <Info className="text-orange-500" />;
            case "ticket": return <Bell className="text-red-500" />;
            default: return <MessageSquare className="text-slate-500" />;
        }
    };

    // Filter logic
    const filteredMessages = messages.filter(msg =>
        msg.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get current user ID to determine styling
    const currentUserId = localStorage.getItem('userId');

    return (
        <div className="flex h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-900">
            {/* Message List Sidebar */}
            <div className={`${selectedMessage ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900`}>
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Inbox</h2>
                        <div className="flex gap-2">
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">
                                <Filter size={18} />
                            </button>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search messages..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 dark:text-white hover:border-[#FF385C] hover:bg-white dark:hover:bg-slate-700 transition-all duration-300"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-slate-500">Loading...</div>
                    ) : filteredMessages.length === 0 ? (
                        <div className="p-4 text-center text-slate-500">No messages found</div>
                    ) : (
                        filteredMessages
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                            .map((msg) => (
                                <div
                                    key={msg.id}
                                    onClick={() => setSelectedMessage(msg)}
                                    className={`p-4 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${selectedMessage?.id === msg.id ? "bg-blue-50 dark:bg-slate-700" : ""
                                        } ${!msg.read ? "bg-slate-50 dark:bg-slate-800/50" : "bg-white dark:bg-slate-900"}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-1 p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700`}>
                                            {getIcon(msg.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className={`text-sm font-semibold truncate ${!msg.read ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>
                                                    {msg.sender}
                                                </p>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap ml-2">
                                                    {new Date(msg.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className={`text-sm mb-1 truncate ${!msg.read ? "font-medium text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>
                                                {msg.subject}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-500 truncate">
                                                {msg.preview}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                    )}
                </div>
            </div>

            {/* Message Detail View (Chat Interface) */}
            <div className={`${selectedMessage ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-slate-50 dark:bg-slate-900/50`}>
                {selectedMessage ? (
                    <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 m-0 md:m-4 md:rounded-lg md:shadow-sm md:border md:border-slate-200 dark:border-slate-800 overflow-hidden h-full">
                        {/* Header */}
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setSelectedMessage(null)}
                                    className="md:hidden p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400"
                                >
                                    <Filter className="rotate-90" size={20} />
                                </button>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${selectedMessage.type === 'ticket' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                    {selectedMessage.sender[0]}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedMessage.sender}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{selectedMessage.subject}</p>
                                </div>
                            </div>
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">
                                <MoreVertical size={20} />
                            </button>
                        </div>

                        {/* Chat Content */}
                        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900 flex flex-col gap-4">
                            {conversationMessages.map((msg, index) => {
                                // Determine if "Me" sent it
                                // For tickets: local const isFromAdmin = ticket.source === 'admin' logic above handled "sender" object
                                // We check if msg.sender._id === currentUserId

                                let isMe = false;
                                if (selectedMessage.type === 'ticket') {
                                    // In ticket logic above, we manually set sender: { _id: 'admin' } or { _id: currentUserId }
                                    isMe = msg.sender._id === currentUserId;
                                } else {
                                    isMe = (msg.sender?._id === null) ? false : (msg.sender._id || msg.sender) === localStorage.getItem('userId');
                                }

                                return (
                                    <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-3 rounded-lg shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                                            }`}>
                                            <p>{msg.content}</p>
                                            <span className={`text-[10px] block mt-1 ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            {conversationMessages.length === 0 && (
                                <div className="text-center text-slate-400 mt-10">No messages yet.</div>
                            )}
                        </div>

                        {/* Input Area */}

                        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
                            {selectedMessage.type === 'ticket' ? (
                                <div className="text-center text-sm text-slate-500 italic p-2 bg-slate-50 dark:bg-slate-800 rounded">
                                    This is a system notification. You cannot reply directly here.
                                    {/* Future: Add 'Create Follow-up Ticket' button */}
                                </div>
                            ) : (
                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 border border-slate-300 dark:border-slate-700 rounded-full px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        placeholder="Type a message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                    >
                                        <Send size={20} />
                                    </button>
                                </form>
                            )}
                        </div>

                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400">
                        <div className="text-center">
                            <MessageSquare size={48} className="mx-auto mb-4 opacity-50 text-slate-300" />
                            <p>Select a message to view details</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

