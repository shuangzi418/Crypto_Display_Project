const jwt = require('jsonwebtoken');
const { User } = require('../models');

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

const isTokenRevoked = (token) => tokenBlacklist.has(token);

const attachUser = async (decoded, req) => {
  const user = await User.findByPk(decoded.id, {
    attributes: { exclude: ['password'] }
  });

  if (!user) {
    return null;
  }

  req.user = user;
  return user;
};

const authenticateToken = async (token, req, expectedType = 'access') => {
  if (!token) {
    return { ok: false, reason: 'missing' };
  }

  if (isTokenRevoked(token)) {
    return { ok: false, reason: 'revoked' };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.tokenType !== expectedType) {
      return { ok: false, reason: 'type' };
    }

    const user = await attachUser(decoded, req);

    if (!user) {
      return { ok: false, reason: 'user' };
    }

    return { ok: true, user };
  } catch (error) {
    return { ok: false, reason: 'invalid' };
  }
};

const protect = async (req, res, next) => {
  const headerToken = (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  )
    ? req.headers.authorization.split(' ')[1]
    : null;
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies.token || null;
  const candidateTokens = [headerToken, cookieToken].filter(Boolean);
  const attemptedTokens = new Set();
  let failureMessage = 'Not authorized, no token';

  for (const token of candidateTokens) {
    if (attemptedTokens.has(token)) {
      continue;
    }

    attemptedTokens.add(token);

    const result = await authenticateToken(token, req);

    if (result.ok) {
      next();
      return;
    }

    switch (result.reason) {
      case 'revoked':
        failureMessage = 'Not authorized, token has been revoked';
        break;
      case 'user':
        failureMessage = 'Not authorized, user not found';
        break;
      default:
        failureMessage = 'Not authorized, token failed';
        break;
    }
  }

  res.status(401).json({ message: failureMessage });
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

module.exports = { protect, admin, revokeToken, isTokenRevoked };
