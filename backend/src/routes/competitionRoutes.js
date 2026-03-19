const express = require('express');
const competitionController = require('../controllers/competitionController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// 添加新竞赛（仅管理员）
router.post('/', protect, admin, competitionController.addCompetition);

// 获取竞赛列表
router.get('/', competitionController.getCompetitions);

// 获取单个竞赛
router.get('/:id', competitionController.getCompetitionById);

// 更新竞赛（仅管理员）
router.put('/:id', protect, admin, competitionController.updateCompetition);

// 删除竞赛（仅管理员）
router.delete('/:id', protect, admin, competitionController.deleteCompetition);

// 更新竞赛状态
router.put('/status/update', protect, admin, competitionController.updateCompetitionStatus);

module.exports = router;
