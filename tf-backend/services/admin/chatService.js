const db = require('../../connection/knexdatabase');
const conn = require("../../connection/database");

module.exports.chatList = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const totalChats = await db("chat")
            .countDistinct({ total: db.raw("LEAST(senderId, receiverId), GREATEST(senderId, receiverId)") })
            .first();

        const chatList = await db("chat")
            .select(
                db.raw("LEAST(senderId, receiverId) as senderId"),
                db.raw("GREATEST(senderId, receiverId) as receiverId"),
                db.raw("MAX(id) as latestMessageId")
            )
            .groupByRaw("LEAST(senderId, receiverId), GREATEST(senderId, receiverId)")
            .orderBy("latestMessageId", "desc")
            .limit(limit)
            .offset(offset);

        if (!chatList.length) {
            return res.json({ message: "No chats found.", data: [], pagination: { currentPage: page, totalPages: 0, totalChats: 0, limit } });
        }

        const userIds = [...new Set(chatList.flatMap(chat => [chat.senderId, chat.receiverId]))];

        const userDetails = await db("users")
            .select("id", "firstName", "lastName", "profileImage", db.raw("'user' as userType"))
            .whereIn("id", userIds)
            .union([
                db("artists")
                    .select("id", "firstName", "lastName", "profileImage", db.raw("'artist' as userType"))
                    .whereIn("id", userIds)
            ]);

        const userMap = new Map();
        userDetails.forEach(user => {
            userMap.set(user.id, {
                name: `${user.firstName} ${user.lastName}`.trim(),
                userType: user.userType,
                profileImage: user.profileImage || ""
            });
        });

        chatList.forEach(chat => {
            chat.senderName = userMap.get(chat.senderId)?.name || "Unknown";
            chat.senderType = userMap.get(chat.senderId)?.userType || "Unknown";
            chat.senderProfileImage = userMap.get(chat.senderId)?.profileImage || "";

            chat.receiverName = userMap.get(chat.receiverId)?.name || "Unknown";
            chat.receiverType = userMap.get(chat.receiverId)?.userType || "Unknown";
            chat.receiverProfileImage = userMap.get(chat.receiverId)?.profileImage || "";
        });

        return res.json({
            message: "Chat list fetched successfully.",
            data: chatList,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalChats.total / limit),
                totalChats: totalChats.total,
                limit: limit
            }
        });
    } catch (error) {
        console.error("Error fetching chat list:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};


module.exports.ChatMessagesData = async (req, res) => {
    const { senderId, receiverId } = req.query;

    if (!senderId || !receiverId) {
        return res.status(400).json({ error: 'senderId and receiverId are required' });
    }

    try {
        // Fetch chat messages
        const chatMessages = await db("chat")
            .where(builder => {
                builder
                    .where({ senderId, receiverId })
                    .orWhere({ senderId: receiverId, receiverId: senderId });
            })
            .orderBy("createdAt", "ASC");

        // Get unique user IDs
        const userIds = new Set([senderId, receiverId]);

        // Fetch user details including profile images
        const userDetails = await db("users")
            .select("id", "firstName", "lastName", "profileImage", db.raw("'user' as userType"))
            .whereIn("id", [...userIds])
            .union([
                db("artists")
                    .select("id", "firstName", "lastName", "profileImage", db.raw("'artist' as userType"))
                    .whereIn("id", [...userIds])
            ]);

        // Map user details
        const userMap = new Map();
        userDetails.forEach(user => {
            userMap.set(user.id, {
                name: `${user.firstName} ${user.lastName}`.trim(),
                userType: user.userType,
                profileImage: user.profileImage || "" // Ensure profileImage is set
            });
        });

        // Attach sender & receiver details to each chat message
        chatMessages.forEach(chat => {
            chat.senderName = userMap.get(chat.senderId)?.name || "";
            chat.senderType = userMap.get(chat.senderId)?.userType || "";
            chat.senderProfileImage = userMap.get(chat.senderId)?.profileImage || "";

            chat.receiverName = userMap.get(chat.receiverId)?.name || "";
            chat.receiverType = userMap.get(chat.receiverId)?.userType || "";
            chat.receiverProfileImage = userMap.get(chat.receiverId)?.profileImage || "";
        });

        res.status(200).json({
            status: 'success',
            data: chatMessages
        });
    } catch (err) {
        console.error('Error fetching chat messages:', err);
        res.status(500).json({ error: 'An error occurred while fetching chat messages' });
    }
};

