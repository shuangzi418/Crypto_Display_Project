const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { H5User, H5ChallengeAttempt } = require('../models');
const { sanitizePlainText } = require('../../utils/sanitize');
const { revokeH5Token, resolveH5Auth } = require('../middleware/auth');

const AWARDED_MEDAL_TIERS = ['bronze', 'silver', 'gold', 'special'];

const secureCookies = process.env.COOKIE_SECURE === 'true'
  || (process.env.COOKIE_SECURE !== 'false' && process.env.NODE_ENV === 'production');

const authCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: secureCookies,
  sameSite: secureCookies ? 'none' : 'lax',
  maxAge
});

const normalizePhone = (phone) => {
  const digits = sanitizePlainText(phone).replace(/\D/g, '');

  if (digits.startsWith('86') && digits.length === 13) {
    return digits.slice(2);
  }

  return digits;
};

const isValidPhone = (phone) => /^1[3-9]\d{9}$/.test(phone);

const serializeH5User = (user, token) => {
  const response = {
    _id: String(user.id),
    id: user.id,
    username: user.username,
    phone: user.phone,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt
  };

  if (token) {
    response.token = token;
  }

  return response;
};

const buildH5AuthResponse = async (user, req, res) => {
  user.lastLoginAt = new Date();
  await user.save();

  const token = jwt.sign({
    id: user.id,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    tokenType: 'h5-access'
  }, process.env.H5_JWT_SECRET || process.env.JWT_SECRET, {
    expiresIn: '30d'
  });

  res.cookie('h5Token', token, authCookieOptions(30 * 24 * 60 * 60 * 1000));
  return serializeH5User(user, token);
};

exports.registerH5User = async (req, res) => {
  const username = sanitizePlainText(req.body.username);
  const phone = normalizePhone(req.body.phone || '');

  if (!username) {
    return res.status(400).json({ message: '请输入用户名' });
  }

  if (!isValidPhone(phone)) {
    return res.status(400).json({ message: '请输入有效的手机号' });
  }

  try {
    const existingUser = await H5User.findOne({
      where: {
        phone
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: '该手机号已注册，请直接登录' });
    }

    const existingUsername = await H5User.findOne({
      where: {
        username
      }
    });

    if (existingUsername) {
      return res.status(400).json({ message: '用户名已被使用，请更换后重试' });
    }

    const user = await H5User.create({
      username,
      phone
    });

    res.status(201).json(await buildH5AuthResponse(user, req, res));
  } catch (error) {
    res.status(500).json({ message: error.message || '注册失败' });
  }
};

exports.loginH5User = async (req, res) => {
  const username = sanitizePlainText(req.body.username);
  const phone = normalizePhone(req.body.phone || '');

  if (!username || !phone) {
    return res.status(400).json({ message: '请输入手机号和用户名' });
  }

  try {
    const user = await H5User.findOne({
      where: {
        phone,
        username
      }
    });

    if (!user) {
      return res.status(401).json({ message: '手机号或用户名不匹配' });
    }

    res.json(await buildH5AuthResponse(user, req, res));
  } catch (error) {
    res.status(500).json({ message: error.message || '登录失败' });
  }
};

exports.getH5Profile = async (req, res) => {
  res.json(serializeH5User(req.h5User));
};

exports.getH5Session = async (req, res) => {
  const auth = await resolveH5Auth(req);

  if (!auth) {
    return res.json({ authenticated: false });
  }

  res.json({
    authenticated: true,
    user: serializeH5User(auth.user)
  });
};

exports.lookupAwardRecords = async (req, res) => {
  const username = sanitizePlainText(req.body.username);
  const phone = normalizePhone(req.body.phone || '');

  if (!username || !phone) {
    return res.status(400).json({ message: '请输入手机号和用户名' });
  }

  if (!isValidPhone(phone)) {
    return res.status(400).json({ message: '请输入有效的手机号' });
  }

  try {
    const user = await H5User.findOne({
      where: {
        phone,
        username
      }
    });

    if (!user) {
      return res.json({
        username,
        phone,
        awards: []
      });
    }

    const awards = await H5ChallengeAttempt.findAll({
      where: {
        userId: user.id,
        medalTier: {
          [Op.in]: AWARDED_MEDAL_TIERS
        }
      },
      order: [['createdAt', 'DESC'], ['id', 'DESC']]
    });

    res.json({
      username: user.username,
      phone: user.phone,
      awards: awards.map((award) => ({
        _id: String(award.id),
        id: award.id,
        medalTier: award.medalTier,
        medalTitle: award.medalTitle,
        correctCount: award.correctCount,
        answeredCount: award.answeredCount,
        totalQuestions: award.totalQuestions,
        createdAt: award.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message || '查询获奖记录失败' });
  }
};

exports.logoutH5User = async (req, res) => {
  if (req.h5Token) {
    revokeH5Token(req.h5Token);
  }

  res.clearCookie('h5Token', authCookieOptions(0));
  res.json({ message: '已退出登录' });
};
