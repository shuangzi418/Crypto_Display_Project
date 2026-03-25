const { User } = require('../models');

exports.getUserRanking = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { role: 'user' },
      attributes: ['id', 'username', 'nickname', 'nicknameStatus', 'avatar', 'avatarStatus', 'score'],
      order: [['score', 'DESC']]
    });

    const ranking = users.map((user, index) => ({
      rank: index + 1,
      userId: String(user.id),
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
