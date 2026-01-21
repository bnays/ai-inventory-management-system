const db = require('../config/db');

/**
 * FETCH UNREAD NOTIFICATIONS
 * Retrieves the latest 10 unread alerts for the Sydney dashboard
 */
exports.getNotifications = async (req, res) => {
    try {
        // Remove the 'is_read = FALSE' filter to show both
        const [rows] = await db.execute(
            `SELECT * FROM notifications ORDER BY is_read ASC, created_at DESC LIMIT 20`
        );
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: "Error fetching notifications", error: error.message });
    }
};

/**
 * MARK NOTIFICATION AS READ
 * Permanently updates the record so it doesn't reappear in polls
 */
exports.markAsRead = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.execute(
            'UPDATE notifications SET is_read = TRUE WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.status(200).json({ message: "Notification marked as read" });
    } catch (error) {
        res.status(500).json({ message: "Database update failed", error: error.message });
    }
};