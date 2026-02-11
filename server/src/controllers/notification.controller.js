import Notification from '../models/Notification.js';

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
    try {
        console.log(`[DEBUG] Fetching notifications for User ID: ${req.user.id}`);
        const notifications = await Notification.find({ recipient: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50); // Limit to last 50

        // Count unread
        const unreadCount = await Notification.countDocuments({
            recipient: req.user.id,
            isRead: false
        });

        res.json({
            success: true,
            data: notifications,
            unreadCount
        });
    } catch (error) {
        console.error("Get Notifications Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        if (notification.recipient.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        notification.isRead = true;
        notification.readAt = Date.now();
        await notification.save();

        res.json({ success: true, data: notification });
    } catch (error) {
        console.error("Mark Read Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Mark ALL notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user.id, isRead: false },
            { $set: { isRead: true, readAt: Date.now() } }
        );

        res.json({ success: true, message: 'All marked as read' });
    } catch (error) {
        console.error("Mark All Read Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- Internal Utility to Create Notification ---
export const createNotification = async ({ recipient, type, title, message, data }) => {
    try {
        const notification = await Notification.create({
            recipient,
            type,
            title,
            message,
            data
        });
        // In a real app, you'd trigger Socket.IO here for real-time push
        return notification;
    } catch (error) {
        console.error("Create Notification Error:", error);
    }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        // Check ownership
        if (notification.recipient.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        await notification.deleteOne();

        res.json({ success: true, message: 'Notification removed' });
    } catch (error) {
        console.error("Delete Notification Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete ALL notifications
// @route   DELETE /api/notifications
// @access  Private
export const deleteAll = async (req, res) => {
    try {
        await Notification.deleteMany({ recipient: req.user.id });
        res.json({ success: true, message: 'All notifications cleared' });
    } catch (error) {
        console.error("Delete All Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
