const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');

// Admin Chat Controllers
const { adminchatListController, adminChatMessagesDataController } = require('../../controllers/admin/chatControlller');

/**
 * @route   GET /admin/chat/list
 * @desc    Get chat list
 * @access  Private
 */
router.get('/list', authenticate, adminchatListController);

/**
 * @route   GET /admin/chat/messages
 * @desc    Get chat messages
 * @access  Private
 */
router.get('/messages', authenticate, adminChatMessagesDataController);

module.exports = router;

