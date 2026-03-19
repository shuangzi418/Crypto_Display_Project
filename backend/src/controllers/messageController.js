const Message = require('../models/Message');

// 获取用户的消息列表
exports.getUserMessages = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const messages = await Message.find({ user: req.user.id }) 
      .sort({ createdAt: -1 }) 
      .limit(50);
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 标记消息为已读
exports.markMessageAsRead = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // 确保消息属于当前用户
    if (message.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    message.isRead = true;
    await message.save();
    
    res.json({ message: 'Message marked as read', message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 删除消息
exports.deleteMessage = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // 确保消息属于当前用户
    if (message.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await message.remove();
    
    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 创建消息（用于系统发送通知）
exports.createMessage = async (userId, title, content, type = 'notification') => {
  try {
    const message = await Message.create({
      user: userId,
      title,
      content,
      type
    });
    return message;
  } catch (error) {
    console.error('Error creating message:', error);
    return null;
  }
};

// 删除用户的所有消息
exports.deleteAllMessages = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    await Message.deleteMany({ user: req.user.id });
    res.json({ message: 'All messages deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
