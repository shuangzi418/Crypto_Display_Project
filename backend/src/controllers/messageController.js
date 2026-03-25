const { Message } = require('../models');

exports.getUserMessages = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const messages = await Message.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markMessageAsRead = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const message = await Message.findByPk(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (String(message.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.isRead = true;
    await message.save();

    res.json({ message: 'Message marked as read', message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const message = await Message.findByPk(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (String(message.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await message.destroy();

    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createMessage = async (userId, title, content, type = 'notification') => {
  try {
    return await Message.create({
      userId,
      title,
      content,
      type
    });
  } catch (error) {
    console.error('Error creating message:', error);
    return null;
  }
};

exports.deleteAllMessages = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    await Message.destroy({ where: { userId: req.user.id } });
    res.json({ message: 'All messages deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
