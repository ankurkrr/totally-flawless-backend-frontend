const db = require('../../connection/knexdatabase');
const admin = require('../../utils/firebaseInit');

module.exports.createNotification = async (req, res) => {
    try {
        const { device_type, title, description } = req.body;

        if (!title || !description) {
            return res.status(400).json({ message: "Missing required fields: title or description." });
        }

        const notification = { device_type: device_type || 'all', title, description };
        await db('notifications').insert(notification);

        let query = db('devices').select('id', 'deviceToken').whereNotNull('deviceToken');

        if (device_type && device_type !== 'all') {
            query = query.where('deviceType', device_type);
        }

        const devices = await query;

        if (!devices.length) {
            return res.status(201).json({ message: "Notification created but no devices found." });
        }

        const deviceTokens = devices.map(device => device.deviceToken);
        const deviceIds = devices.map(device => device.id);

        console.log("Sending Notification to Devices:");
        console.log("Device IDs:", deviceIds);
        console.log("Device Tokens:", deviceTokens);

        const message = {
            notification: {
                title: title,
                body: description,
            },
            tokens: deviceTokens,
        };

        let response;
        if (admin.messaging().sendMulticast) {
            response = await admin.messaging().sendMulticast(message);
        } else {
            response = await admin.messaging().sendEachForMulticast(message);
        }

        return res.status(201).json({
            message: "Notification sent successfully.",
            deviceIds: deviceIds,
            successCount: response.successCount || deviceTokens.length,
            failureCount: response.failureCount || 0,
        });

    } catch (err) {
        console.error("Error creating notification:", err);
        return res.status(500).json({ message: "Internal server error." });
    }
};

module.exports.getNotifications = async (req, res) => {
    try {
        let { page, limit } = req.query;

        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        const offset = (page - 1) * limit;

        const totalNotifications = await db("notifications").count("* as count");
        const totalCount = totalNotifications[0]?.count || 0;

        if (totalCount === 0) {
            return res.status(200).json({
                message: "No notifications found.",
                total: 0,
                currentPage: page,
                totalPages: 0,
                notifications: [],
            });
        }

        const notifications = await db("notifications")
            .select("id", "device_type", "title", "description", "created_at")
            .orderBy("created_at", "desc")
            .limit(limit)
            .offset(offset);

        res.status(200).json({
            message: "Notifications retrieved successfully.",
            total: totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            notifications: notifications || [],
        });
    } catch (err) {
        console.error("Error fetching notifications:", err);
        res.status(500).json({ message: "Internal server error." });
    }
};

