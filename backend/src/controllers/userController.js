const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { revokeToken } = require('../middleware/auth');
const nodemailer = require('nodemailer');

const authCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge
});

// 输入清理函数，防止NoSQL注入
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    // 移除特殊字符，防止NoSQL注入
    return input.replace(/[\$\{\}]/g, '').trim();
  }
  return input;
};

// 生成JWT令牌
const generateToken = (id, ip, userAgent) => {
  return jwt.sign({ 
    id, 
    ip, 
    userAgent 
  }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });
};

// 生成刷新令牌
const generateRefreshToken = (id, ip, userAgent) => {
  return jwt.sign({ 
    id, 
    ip, 
    userAgent 
  }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// 生成密码重置令牌
const generateResetToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h', // 1小时过期
  });
};

// 配置邮件发送器
const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 发送密码重置邮件
const sendResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
  
  const mailOptions = {
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
  };
  
  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('邮件发送失败:', error);
    return false;
  }
};

const buildAuthResponse = (user, req, res) => {
  const ip = req.ip;
  const userAgent = req.get('User-Agent');
  const token = generateToken(user._id, ip, userAgent);
  const refreshToken = generateRefreshToken(user._id, ip, userAgent);

  res.cookie('token', token, authCookieOptions(24 * 60 * 60 * 1000));
  res.cookie('refreshToken', refreshToken, authCookieOptions(7 * 24 * 60 * 60 * 1000));

  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    score: user.score,
    nickname: user.nickname,
    avatar: user.avatar,
    avatarStatus: user.avatarStatus,
    nicknameStatus: user.nicknameStatus,
    token
  };
};

// 注册新用户
exports.registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    // 清理输入，防止NoSQL注入
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedUsername = sanitizeInput(username);
    
    const userExists = await User.findOne({ email: sanitizedEmail });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      username: sanitizedUsername,
      email: sanitizedEmail,
      password,
      role: 'user'
    });

    if (user) {
      res.status(201).json(buildAuthResponse(user, req, res));
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 用户登录
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 清理输入，防止NoSQL注入
    const sanitizedEmail = sanitizeInput(email);
    const user = await User.findOne({ email: sanitizedEmail });

    if (user && (await user.matchPassword(password))) {
      res.json(buildAuthResponse(user, req, res));
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 获取当前用户信息
exports.getUserProfile = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  const user = await User.findById(req.user.id);

  if (user) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      score: user.score,
      nickname: user.nickname,
      avatar: user.avatar,
      avatarStatus: user.avatarStatus,
      nicknameStatus: user.nicknameStatus
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// 更新用户信息
exports.updateUserProfile = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  const user = await User.findById(req.user.id);

  if (user) {
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json(buildAuthResponse(updatedUser, req, res));
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// 更新个人设置（头像和昵称）
exports.updateUserSettings = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  const user = await User.findById(req.user.id);

  if (user) {
    if (req.user.role !== 'admin') {
      if (req.body.nickname) {
        user.nickname = req.body.nickname;
        user.nicknameStatus = 'pending';
      }
      if (req.body.avatar) {
        user.avatar = req.body.avatar;
        user.avatarStatus = 'pending';
      }
    } else {
      if (req.body.nickname) {
        user.nickname = req.body.nickname;
        user.nicknameStatus = 'approved';
      }
      if (req.body.avatar) {
        user.avatar = req.body.avatar;
        user.avatarStatus = 'approved';
      }
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      nickname: updatedUser.nickname,
      avatar: updatedUser.avatar,
      avatarStatus: updatedUser.avatarStatus,
      nicknameStatus: updatedUser.nicknameStatus
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// 审核用户昵称
exports.approveNickname = async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(401).json({ message: 'Not authorized as an admin' });
  }
  const { userId, status } = req.body;

  try {
    const user = await User.findById(userId);
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

// 获取待审核的用户昵称
exports.getPendingNicknames = async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(401).json({ message: 'Not authorized as an admin' });
  }

  try {
    const { search } = req.query;
    let query = { nicknameStatus: 'pending', role: { $ne: 'admin' } };
    
    // 如果有搜索参数，构建搜索条件
    if (search) {
      query = {
        ...query,
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { nickname: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 审核用户头像
exports.approveAvatar = async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(401).json({ message: 'Not authorized as an admin' });
  }
  const { userId, status } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const oldStatus = user.avatarStatus;
    user.avatarStatus = status;
    await user.save();

    // 发送通知
    const messageController = require('./messageController');
    let title, content;
    if (status === 'approved') {
      title = '头像审核通过';
      content = '您的头像已通过审核，现在可以在排行榜上显示了。';
    } else if (status === 'rejected') {
      title = '头像审核拒绝';
      content = '您的头像未通过审核，请上传符合要求的头像。';
    }
    
    if (title && content) {
      await messageController.createMessage(userId, title, content, 'notification');
    }

    res.json({ message: 'Avatar status updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 获取待审核的用户头像
exports.getPendingAvatars = async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(401).json({ message: 'Not authorized as an admin' });
  }

  try {
    const { search } = req.query;
    let query = { avatarStatus: 'pending', role: { $ne: 'admin' } };
    
    // 如果有搜索参数，构建搜索条件
    if (search) {
      query = {
        ...query,
        $or: [
          { username: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 刷新令牌
exports.refreshToken = async (req, res) => {
  let refreshToken = req.body && req.body.refreshToken;
  if (!refreshToken && req.headers && req.headers.cookie) {
    const parseCookies = (cookieHeader) => {
      return cookieHeader.split(';').reduce((acc, part) => {
        const [key, ...rest] = part.trim().split('=');
        acc[key] = decodeURIComponent(rest.join('='));
        return acc;
      }, {});
    };
    const cookies = parseCookies(req.headers.cookie);
    refreshToken = cookies.refreshToken;
  }

  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token provided' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const ip = req.ip;
    const userAgent = req.get('User-Agent');
    const token = generateToken(user._id, ip, userAgent);
    const newRefreshToken = generateRefreshToken(user._id, ip, userAgent);

    res.cookie('token', token, authCookieOptions(24 * 60 * 60 * 1000));
    res.cookie('refreshToken', newRefreshToken, authCookieOptions(7 * 24 * 60 * 60 * 1000));

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      score: user.score,
      nickname: user.nickname,
      avatar: user.avatar,
      avatarStatus: user.avatarStatus,
      nicknameStatus: user.nicknameStatus,
      token,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// 登出用户
exports.logout = async (req, res) => {
  try {
    // 从请求头中获取token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) {
      const token = authHeader.split(' ')[1];
      // 将token添加到黑名单
      revokeToken(token);
    }

    // 清除cookie
    res.clearCookie('token');
    res.clearCookie('refreshToken');

    res.json({ message: 'Successfully logged out' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 密码找回
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 生成密码重置令牌
    const resetToken = generateResetToken(user._id);

    // 发送重置邮件
    const emailSent = await sendResetEmail(email, resetToken);

    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send reset email' });
    }

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 重置密码
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
    // 验证重置令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 更新密码
    user.password = password;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Invalid or expired reset token' });
  }
};

// 获取所有用户列表（管理员专用）
exports.getUsers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    
    // 如果有搜索参数，构建搜索条件
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 修改用户角色（管理员专用）
exports.updateUserRole = async (req, res) => {
  const { role } = req.body;
  const { id } = req.params;

  try {
    const user = await User.findById(id);
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
