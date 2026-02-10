import { Conversation, Message } from '../models/Conversation.js';
import User from '../models/User.js';

// @desc    Get all conversations for the current user
// @route   GET /api/conversations
// @access  Private
export const getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user._id
        })
            .populate('participants', 'name email role profileImage')
            .populate('contextListing', 'title')
            .sort({ updatedAt: -1 });

        res.json(conversations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get messages for a conversation
// @route   GET /api/conversations/:id/messages
// @access  Private
export const getMessages = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user is participant
        const conversation = await Conversation.findById(id);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        if (!conversation.participants.includes(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const messages = await Message.find({ conversation: id })
            .populate('sender', 'name email profileImage')
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send a message
// @route   POST /api/conversations/:id/messages
// @access  Private
export const sendMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        const conversation = await Conversation.findById(id);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        if (!conversation.participants.includes(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const newMessage = await Message.create({
            conversation: id,
            sender: req.user._id,
            content,
            readBy: [req.user._id]
        });

        // Update conversation last message
        conversation.lastMessageContent = content;
        await conversation.save();

        // Populate sender for immediate frontend display
        await newMessage.populate('sender', 'name email profileImage');

        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new conversation or get existing one
// @route   POST /api/conversations
// @access  Private
export const createConversation = async (req, res) => {
    try {
        const { participantId, listingId, initialMessage } = req.body;

        if (!participantId) {
            return res.status(400).json({ message: 'Participant ID is required' });
        }

        // Check if conversation already exists between these two users for this listing (optional listing check)
        // For simplicity, let's just check participants for now, or listing + participants
        let query = {
            participants: { $all: [req.user._id, participantId] }
        };

        if (listingId) {
            query.contextListing = listingId;
        }

        let conversation = await Conversation.findOne(query);

        if (conversation) {
            // If initial message provided, send it
            if (initialMessage) {
                const newMessage = await Message.create({
                    conversation: conversation._id,
                    sender: req.user._id,
                    content: initialMessage,
                    readBy: [req.user._id]
                });
                conversation.lastMessageContent = initialMessage;
                await conversation.save();
            }
            return res.json(conversation);
        }

        // Create new
        conversation = await Conversation.create({
            participants: [req.user._id, participantId],
            contextListing: listingId || null,
            lastMessageContent: initialMessage || 'Started a conversation'
        });

        if (initialMessage) {
            await Message.create({
                conversation: conversation._id,
                sender: req.user._id,
                content: initialMessage,
                readBy: [req.user._id]
            });
        }

        res.status(201).json(conversation);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
