const chatService = require('../../services/admin/chatService');

module.exports.adminchatListController = async (req, res) => {
    try {
        const response = await chatService.chatList(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};

module.exports.adminChatMessagesDataController = async (req, res) => {
    try {
        const response = await chatService.ChatMessagesData(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};



