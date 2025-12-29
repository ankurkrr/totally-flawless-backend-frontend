const conn = require("../connection/database");
const moment = require('moment');

module.exports.Chat = async (req, res) => {
    const { senderId, receiverId, message } = req.body;

    if (!senderId || !receiverId || !message) {
        return res.status(400).json({ error: 'senderId, receiverId, and message are required' });
    }

    const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');

    try {
        const insertQuery = `
            INSERT INTO chat (senderId, receiverId, message, createdAt)
            VALUES ("${senderId}", "${receiverId}", "${message}", "${dateTime}")
        `;

        await conn.promise().query(insertQuery);

        res.status(201).json({
            status: 'success',
            message: 'Chat message sent successfully',
        });
    } catch (err) {
        console.error('Error saving chat message:', err);
        res.status(500).json({ error: 'An error occurred while sending the message' });
    }
};

module.exports.ChatMessages = async (req, res) => {
    const { senderId, receiverId } = req.query;

    if (!senderId || !receiverId) {
        return res.status(400).json({ error: 'senderId and receiverId are required' });
    }

    try {
        const fetchQuery = `
            SELECT * FROM chat
            WHERE (senderId = "${senderId}" AND receiverId = "${receiverId}")
            OR (senderId = "${receiverId}" AND receiverId = "${senderId}")
            ORDER BY createdAt ASC
        `;

        const [chatMessages] = await conn.promise().query(fetchQuery);

        res.status(200).json({
            status: 'success',
            data: chatMessages,
        });
    } catch (err) {
        console.error('Error fetching chat messages:', err);
        res.status(500).json({ error: 'An error occurred while fetching chat messages' });
    }
};

module.exports.ChatList = async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        const query = `
            SELECT DISTINCT
                CASE
                    WHEN senderId = "${userId}" THEN receiverId
                    ELSE senderId
                END AS chatPartnerId
            FROM chat
            WHERE senderId = "${userId}" OR receiverId = "${userId}"
        `;

        const result = await conn.promise().query(query);

        if (result[0].length === 0) {
            return res.status(404).json({ message: 'No chat partners found' });
        }

        // Extract chat partner IDs
        const chatPartners = result[0].map(item => item.chatPartnerId);

        res.status(200).json({
            status: 'success',
            data: chatPartners,
        });
    } catch (err) {
        console.error('Error fetching chat partners:', err);
        return res.status(500).json({ error: 'An error occurred while fetching chat partners' });
    }
};