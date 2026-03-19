const express = require('express');
const questionController = require('../controllers/questionController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// 添加新题目（仅管理员）
router.post('/', protect, admin, questionController.addQuestion);

// 获取题目列表
router.get('/', protect, questionController.getQuestions);

// 获取单个题目
router.get('/:id', questionController.getQuestionById);

// 更新题目（仅管理员）
router.put('/:id', protect, admin, questionController.updateQuestion);

// 删除题目（仅管理员）
router.delete('/:id', protect, admin, questionController.deleteQuestion);

module.exports = router;