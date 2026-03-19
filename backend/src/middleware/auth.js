const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Token黑名单（开发环境使用内存存储，生产环境建议使用Redis）
const tokenBlacklist = new Set();

// 从Cookie头解析键值
const parseCookies = (cookieHeader) => {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((acc, part) => {
    const [key, ...rest] = part.trim().split('=');
    acc[key] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
};

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // 检查token是否在黑名单中
      if (tokenBlacklist.has(token)) {
        return res.status(401).json({ message: 'Not authorized, token has been revoked' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next();
      return;
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
      return;
    }
  }

  // 回退：从Cookie读取token
  try {
    const cookies = parseCookies(req.headers.cookie);
    token = cookies.token;
    if (token) {
      if (tokenBlacklist.has(token)) {
        return res.status(401).json({ message: 'Not authorized, token has been revoked' });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      next();
      return;
    }
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }

  res.status(401).json({ message: 'Not authorized, no token' });
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

// 撤销token（添加到黑名单）
const revokeToken = (token) => {
  tokenBlacklist.add(token);
};

module.exports = { protect, admin, revokeToken };
