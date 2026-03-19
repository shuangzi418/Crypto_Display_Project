const express = require('express');
const rankingController = require('../controllers/rankingController');

const router = express.Router();

// 获取用户排行榜
router.get('/ranking', rankingController.getUserRanking);

module.exports = router;