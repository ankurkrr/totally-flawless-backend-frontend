const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validation');

// Chat Controllers
const { ChatController, ChatMessagesController, ChatListController } = require('../controllers/ChatController');

// Validators
const { sendChatMessageSchema, getChatMessagesSchema, getChatListSchema } = require('../validators/chatValidators');

/**
 * @route   POST /api/chat
 * @desc    Send chat message
 * @access  Private
 */
router.post('/', authenticate, validate(sendChatMessageSchema), ChatController);

/**
 * @route   GET /api/chat/messages
 * @desc    Get chat messages between users
 * @access  Private
 */
router.get('/messages', authenticate, validate(getChatMessagesSchema, 'query'), ChatMessagesController);

/**
 * @route   GET /api/chat/list
 * @desc    Get chat list for user
 * @access  Private
 */
router.get('/list', authenticate, validate(getChatListSchema, 'query'), ChatListController);

module.exports = router;

