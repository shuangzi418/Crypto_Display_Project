const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { H5User, H5ChallengeAttempt } = require('../models');
const { sanitizePlainText } = require('../../utils/sanitize');
const { revokeH5Token, resolveH5Auth } = require('../middleware/auth');

const RAW_AWARDED_MEDAL_TIERS = ['bronze', 'silver', 'gold', 'special'];
const DISPLAY_MEDAL_TIER_MAP = {
  bronze: 'silver',
  silver: 'silver',
  gold: 'gold',
  special: 'gold'
};
const DISPLAY_MEDAL_TITLE_MAP = {
  silver: '密码安全银奖',
  gold: '密码安全金奖'
};

const secureCookies = process.env.COOKIE_SECURE === 'true'
  || (process.env.COOKIE_SECURE !== 'false' && process.env.NODE_ENV === 'production');

const authCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: secureCookies,
  sameSite: secureCookies ? 'none' : 'lax',
  maxAge
});

const normalizeUsername = (value) => sanitizePlainText(value).trim();

const normalizeMedalTier = (tier) => DISPLAY_MEDAL_TIER_MAP[String(tier || '').trim()] || String(tier || '').trim();

const normalizeMedalTitle = (title, tier) => {
  const normalizedTier = normalizeMedalTier(tier);

  return DISPLAY_MEDAL_TITLE_MAP[normalizedTier] || normalizeUsername(title);
};

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

const createH5User = (username) => H5User.create({ username });

exports.accessH5User = async (req, res) => {
  const username = normalizeUsername(req.body.username);

  if (!username) {
    return res.status(400).json({ message: '请输入昵称' });
  }

  try {
    const existingUser = await H5User.findOne({
      where: {
        username
      }
    });

    if (existingUser) {
      return res.json({
        ...(await buildH5AuthResponse(existingUser, req, res)),
        accessMode: 'login'
      });
    }

    const user = await createH5User(username);

    res.status(201).json({
      ...(await buildH5AuthResponse(user, req, res)),
      accessMode: 'register'
    });
  } catch (error) {
    res.status(500).json({ message: error.message || '进入挑战失败' });
  }
};

exports.registerH5User = async (req, res) => {
  const username = normalizeUsername(req.body.username);

  if (!username) {
    return res.status(400).json({ message: '请输入昵称' });
  }

  try {
    const existingUsername = await H5User.findOne({
      where: {
        username
      }
    });

    if (existingUsername) {
      return res.status(400).json({ message: '昵称已被使用，请直接登录' });
    }

    const user = await createH5User(username);

    res.status(201).json(await buildH5AuthResponse(user, req, res));
  } catch (error) {
    res.status(500).json({ message: error.message || '注册失败' });
  }
};

exports.loginH5User = async (req, res) => {
  const username = normalizeUsername(req.body.username);

  if (!username) {
    return res.status(400).json({ message: '请输入昵称' });
  }

  try {
    const user = await H5User.findOne({
      where: {
        username
      }
    });

    if (!user) {
      return res.status(401).json({ message: '昵称不存在，请先注册' });
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
  const username = normalizeUsername(req.body.username);

  if (!username) {
    return res.status(400).json({ message: '请输入昵称' });
  }

  try {
    const user = await H5User.findOne({
      where: {
        username
      }
    });

    if (!user) {
      return res.json({
        username,
        awards: []
      });
    }

    const awards = await H5ChallengeAttempt.findAll({
      where: {
        userId: user.id,
        medalTier: {
          [Op.in]: RAW_AWARDED_MEDAL_TIERS
        }
      },
      order: [['createdAt', 'DESC'], ['id', 'DESC']]
    });

    res.json({
      username: user.username,
      awards: awards.map((award) => ({
        _id: String(award.id),
        id: award.id,
        medalTier: normalizeMedalTier(award.medalTier),
        medalTitle: normalizeMedalTitle(award.medalTitle, award.medalTier),
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
