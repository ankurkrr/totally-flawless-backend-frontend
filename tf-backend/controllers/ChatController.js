const chatService = require("../services/ChatService");

module.exports.ChatController = async (req, res) => {
    try {
        const response = await chatService.Chat(req, res);
        return response;
    } catch (err) {
        throw err;
    }
};

module.exports.ChatMessagesController = async (req, res) => {
    try {
        const response = await chatService.ChatMessages(req, res);
        return response;
    } catch (err) {
        throw err;
    }
};

module.exports.ChatListController = async (req, res) => {
    try {
        const response = await chatService.ChatList(req, res);
        return response;
    } catch (err) {
        throw err;
    }
};

