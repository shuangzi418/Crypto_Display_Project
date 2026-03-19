const User = require('../models/User');

// 获取用户排行榜
exports.getUserRanking = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('username nickname nicknameStatus avatar avatarStatus score')
      .sort({ score: -1 });

    // 计算排名
    const ranking = users.map((user, index) => ({
      rank: index + 1,
      userId: user._id,
      username: user.username,
      nickname: user.nickname,
      nicknameStatus: user.nicknameStatus,
      avatar: user.avatar,
      avatarStatus: user.avatarStatus,
      score: user.score
    }));

    res.json(ranking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};