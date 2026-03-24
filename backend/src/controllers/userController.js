const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const { User } = require('../models');
const { revokeToken, isTokenRevoked } = require('../middleware/auth');
const { sanitizeInput, sanitizePlainText } = require('../utils/sanitize');

const secureCookies = process.env.COOKIE_SECURE === 'true'
  || (process.env.COOKIE_SECURE !== 'false' && process.env.NODE_ENV === 'production');

const authCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: secureCookies,
  sameSite: secureCookies ? 'strict' : 'lax',
  maxAge
});

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const AVATAR_URL_PATTERN = /^https?:\/\//i;
const AVATAR_DATA_URL_PATTERN = /^data:image\/(png|jpe?g|gif|webp|bmp|svg\+xml);base64,[A-Za-z0-9+/=]+$/i;

const generateToken = (id, ip, userAgent) => jwt.sign({
  id,
  ip,
  userAgent,
  tokenType: 'access'
}, process.env.JWT_SECRET, {
  expiresIn: '24h'
});

const generateRefreshToken = (id, ip, userAgent) => jwt.sign({
  id,
  ip,
  userAgent,
  tokenType: 'refresh'
}, process.env.JWT_SECRET, {
  expiresIn: '7d'
});

const generateResetToken = (id) => jwt.sign({ id, tokenType: 'password-reset' }, process.env.JWT_SECRET, {
  expiresIn: '1h'
});

let transporter;
let nodemailer;

const getTransporter = () => {
  if (!transporter) {
    if (!nodemailer) {
      nodemailer = require('nodemailer');
    }

    transporter = nodemailer.createTransport({
      host: 'smtp.qq.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  return transporter;
};

const estimateBase64Bytes = (value) => {
  const [, base64Payload = ''] = String(value).split(',');
  const paddingLength = (base64Payload.match(/=*$/) || [''])[0].length;
  return Math.max(0, Math.floor((base64Payload.length * 3) / 4) - paddingLength);
};

const normalizeAvatarInput = (avatar) => {
  if (typeof avatar !== 'string') {
    throw new Error('Avatar must be a string');
  }

  const normalizedAvatar = avatar.trim();

  if (!normalizedAvatar) {
    return '';
  }

  if (AVATAR_URL_PATTERN.test(normalizedAvatar)) {
    if (normalizedAvatar.length > 2048) {
      throw new Error('Avatar URL is too long');
    }

    return sanitizeInput(normalizedAvatar);
  }

  if (!AVATAR_DATA_URL_PATTERN.test(normalizedAvatar)) {
    throw new Error('Avatar must be a valid image data URL or http(s) URL');
  }

  if (estimateBase64Bytes(normalizedAvatar) > MAX_AVATAR_BYTES) {
    throw new Error('Avatar file cannot exceed 2MB');
  }

  return normalizedAvatar;
};

const sendResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

  try {
    await getTransporter().sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: '密码重置请求',
      html: `
        <h1>密码重置请求</h1>
        <p>您收到此邮件是因为有人请求重置您的密码。</p>
        <p>请点击以下链接重置密码：</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>如果您没有请求重置密码，请忽略此邮件。</p>
        <p>此链接将在1小时后过期。</p>
      `
    });
    return true;
  } catch (error) {
    console.error('邮件发送失败:', error);
    return false;
  }
};

const parseCookies = (cookieHeader) => {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(';').reduce((accumulator, part) => {
    const [key, ...rest] = part.trim().split('=');
    accumulator[key] = decodeURIComponent(rest.join('='));
    return accumulator;
  }, {});
};

const serializeUser = (user, includeToken) => {
  const response = {
    _id: String(user.id),
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    score: user.score,
    nickname: user.nickname,
    avatar: user.avatar,
    avatarStatus: user.avatarStatus,
    nicknameStatus: user.nicknameStatus,
    createdAt: user.createdAt
  };

  if (includeToken) {
    response.token = includeToken;
  }

  return response;
};

const buildAuthResponse = (user, req, res) => {
  const ip = req.ip;
  const userAgent = req.get('User-Agent');
  const token = generateToken(user.id, ip, userAgent);
  const refreshToken = generateRefreshToken(user.id, ip, userAgent);

  res.cookie('token', token, authCookieOptions(24 * 60 * 60 * 1000));
  res.cookie('refreshToken', refreshToken, authCookieOptions(7 * 24 * 60 * 60 * 1000));

  return serializeUser(user, token);
};

exports.registerUser = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const username = sanitizePlainText(req.body.username);
  const email = sanitizePlainText(req.body.email).toLowerCase();
  const { password } = req.body;

  try {
    const userExists = await User.findOne({ where: { email } });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      username,
      email,
      password,
      role: 'user'
    });

    res.status(201).json(buildAuthResponse(user, req, res));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.loginUser = async (req, res) => {
  const email = sanitizePlainText(req.body.email).toLowerCase();
  const { password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (user && await user.matchPassword(password)) {
      return res.json(buildAuthResponse(user, req, res));
    }

    res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserProfile = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const user = await User.findByPk(req.user.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json(serializeUser(user));
};

exports.updateUserProfile = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const user = await User.findByPk(req.user.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const nextUsername = req.body.username ? sanitizePlainText(req.body.username) : user.username;
  const nextEmail = req.body.email ? sanitizePlainText(req.body.email).toLowerCase() : user.email;

  if (!nextUsername) {
    return res.status(400).json({ message: 'Username is required' });
  }

  if (!isValidEmail(nextEmail)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  const existingUser = await User.findOne({
    where: {
      [Op.or]: [
        { username: nextUsername },
        { email: nextEmail }
      ],
      id: {
        [Op.ne]: user.id
      }
    }
  });

  if (existingUser) {
    return res.status(400).json({ message: 'Username or email already in use' });
  }

  user.username = nextUsername;
  user.email = nextEmail;

  if (req.body.password) {
    if (!req.body.currentPassword) {
      return res.status(400).json({ message: 'Current password is required' });
    }

    const passwordMatched = await user.matchPassword(req.body.currentPassword);

    if (!passwordMatched) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    if (req.body.password.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    user.password = req.body.password;
  }

  const updatedUser = await user.save();
  res.json(buildAuthResponse(updatedUser, req, res));
};

exports.updateUserSettings = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.body.nickname) {
      user.nickname = sanitizeInput(req.body.nickname);
      user.nicknameStatus = req.user.role === 'admin' ? 'approved' : 'pending';
    }

    if (req.body.avatar !== undefined) {
      user.avatar = normalizeAvatarInput(req.body.avatar);
      user.avatarStatus = req.user.role === 'admin' ? 'approved' : 'pending';
    }

    const updatedUser = await user.save();

    res.json({
      _id: String(updatedUser.id),
      id: updatedUser.id,
      username: updatedUser.username,
      nickname: updatedUser.nickname,
      avatar: updatedUser.avatar,
      avatarStatus: updatedUser.avatarStatus,
      nicknameStatus: updatedUser.nicknameStatus
    });
  } catch (error) {
    const statusCode = error.message && error.message.startsWith('Avatar') ? 400 : 500;
    res.status(statusCode).json({ message: error.message || 'Failed to update user settings' });
  }
};

exports.approveNickname = async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(401).json({ message: 'Not authorized as an admin' });
  }

  const { userId, status } = req.body;

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.nicknameStatus = status;
    await user.save();

    res.json({ message: 'Nickname status updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPendingNicknames = async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(401).json({ message: 'Not authorized as an admin' });
  }

  try {
    const where = {
      nicknameStatus: 'pending',
      role: {
        [Op.ne]: 'admin'
      }
    };

    if (req.query.search) {
      const keyword = `%${req.query.search.trim()}%`;
      where[Op.or] = [
        { username: { [Op.like]: keyword } },
        { nickname: { [Op.like]: keyword } }
      ];
    }

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password'] }
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveAvatar = async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(401).json({ message: 'Not authorized as an admin' });
  }

  const { userId, status } = req.body;

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.avatarStatus = status;
    await user.save();

    const messageController = require('./messageController');
    let title;
    let content;

    if (status === 'approved') {
      title = '头像审核通过';
      content = '您的头像已通过审核，现在可以在排行榜上显示了。';
    } else if (status === 'rejected') {
      title = '头像审核拒绝';
      content = '您的头像未通过审核，请上传符合要求的头像。';
    }

    if (title && content) {
      await messageController.createMessage(user.id, title, content, 'notification');
    }

    res.json({ message: 'Avatar status updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPendingAvatars = async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(401).json({ message: 'Not authorized as an admin' });
  }

  try {
    const where = {
      avatarStatus: 'pending',
      role: {
        [Op.ne]: 'admin'
      }
    };

    if (req.query.search) {
      const keyword = `%${req.query.search.trim()}%`;
      where[Op.or] = [
        { username: { [Op.like]: keyword } }
      ];
    }

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password'] }
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  let refreshToken = req.body && req.body.refreshToken;

  if (!refreshToken && req.headers && req.headers.cookie) {
    const cookies = parseCookies(req.headers.cookie);
    refreshToken = cookies.refreshToken;
  }

  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token provided' });
  }

  try {
    if (isTokenRevoked(refreshToken)) {
      return res.status(401).json({ message: 'Refresh token has been revoked' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    if (decoded.tokenType !== 'refresh') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const response = buildAuthResponse(user, req, res);
    res.json({
      ...response,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

exports.logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const cookies = parseCookies(req.headers.cookie);

    if (authHeader && authHeader.startsWith('Bearer')) {
      const token = authHeader.split(' ')[1];
      revokeToken(token);
    }

    if (cookies.token) {
      revokeToken(cookies.token);
    }

    if (cookies.refreshToken) {
      revokeToken(cookies.refreshToken);
    }

    res.clearCookie('token');
    res.clearCookie('refreshToken');
    res.json({ message: 'Successfully logged out' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const email = sanitizePlainText(req.body.email).toLowerCase();

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = generateResetToken(user.id);
    const emailSent = await sendResetEmail(email, resetToken);

    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send reset email' });
    }

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.tokenType !== 'password-reset') {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    user.password = password;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Invalid or expired reset token' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const where = {};

    if (req.query.search) {
      const keyword = `%${req.query.search.trim()}%`;
      where[Op.or] = [
        { username: { [Op.like]: keyword } },
        { email: { [Op.like]: keyword } }
      ];
    }

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUserRole = async (req, res) => {
  const { role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({ message: 'User role updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
