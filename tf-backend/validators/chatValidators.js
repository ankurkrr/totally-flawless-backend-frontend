const Joi = require('joi');

/**
 * Send Chat Message Schema
 */
const sendChatMessageSchema = Joi.object({
    senderId: Joi.string().uuid().required(),
    receiverId: Joi.string().uuid().required(),
    message: Joi.string().trim().min(1).max(2000).required()
        .messages({
            'string.min': 'Message cannot be empty',
            'string.max': 'Message cannot exceed 2000 characters'
        }),
    bookingId: Joi.string().uuid().optional().allow(null, '')
});

/**
 * Get Chat Messages Query Schema
 */
const getChatMessagesSchema = Joi.object({
    conversationId: Joi.string().uuid().required(),
    limit: Joi.number().integer().min(1).max(100).default(50).optional(),
    offset: Joi.number().integer().min(0).default(0).optional()
});

/**
 * Get Chat List Query Schema
 */
const getChatListSchema = Joi.object({
    userId: Joi.string().uuid().required(),
    limit: Joi.number().integer().min(1).max(100).default(50).optional(),
    offset: Joi.number().integer().min(0).default(0).optional()
});

module.exports = {
    sendChatMessageSchema,
    getChatMessagesSchema,
    getChatListSchema
};

