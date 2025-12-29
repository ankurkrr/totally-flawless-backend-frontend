const notificationService = require('../../services/admin/notificationService');

module.exports.admincreateNotificationController = async (req, res) => {
    try {
        const response = await notificationService.createNotification(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};

module.exports.admingetNotificationsController = async (req, res) => {
    try {
        const response = await notificationService.getNotifications(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};


