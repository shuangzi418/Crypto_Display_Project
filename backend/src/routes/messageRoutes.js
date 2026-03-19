const express = require('express');
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// 获取用户消息列表
router.get('/', protect, messageController.getUserMessages);

// 标记消息为已读
router.put('/:id/read', protect, messageController.markMessageAsRead);

// 删除所有消息
router.delete('/', protect, messageController.deleteAllMessages);

// 删除消息
router.delete('/:id', protect, messageController.deleteMessage);

module.exports = router;
