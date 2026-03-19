const express = require('express');
const submissionController = require('../controllers/submissionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// 提交答案
router.post('/', protect, submissionController.submitAnswer);

// 获取用户答题历史
router.get('/history', protect, submissionController.getUserSubmissions);

// 参加竞赛
router.post('/competition/join', protect, submissionController.joinCompetition);

// 提交竞赛答案
router.post('/competition/submit', protect, submissionController.submitCompetitionAnswer);

// 获取竞赛排行榜
router.get('/competition/:competitionId/ranking', submissionController.getCompetitionRanking);

module.exports = router;