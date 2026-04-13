const jwt = require('jsonwebtoken');
const { H5User } = require('../models');

const tokenBlacklist = new Set();

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

const h5JwtSecret = () => process.env.H5_JWT_SECRET || process.env.JWT_SECRET;

const revokeH5Token = (token) => {
  tokenBlacklist.add(token);
};

const resolveH5Auth = async (req) => {
  const headerToken = (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  )
    ? req.headers.authorization.split(' ')[1]
    : null;
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies.h5Token || null;
  const candidateTokens = [headerToken, cookieToken].filter(Boolean);

  for (const token of candidateTokens) {
    if (tokenBlacklist.has(token)) {
      continue;
    }

    try {
      const decoded = jwt.verify(token, h5JwtSecret());

      if (decoded.tokenType !== 'h5-access') {
        continue;
      }

      const user = await H5User.findByPk(decoded.id);

      if (!user) {
        continue;
      }

      return {
        user,
        token
      };
    } catch (error) {
      continue;
    }
  }

  return null;
};

const protectH5User = async (req, res, next) => {
  const auth = await resolveH5Auth(req);

  if (auth) {
    req.h5User = auth.user;
    req.h5Token = auth.token;
    next();
    return;
  }

  res.status(401).json({ message: '请先登录后再参与挑战' });
};

module.exports = {
  protectH5User,
  revokeH5Token,
  resolveH5Auth
};
