const express = require('express');
const multer = require('multer');
const questionController = require('../controllers/questionController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

// 添加新题目（仅管理员）
router.post('/', protect, admin, questionController.addQuestion);

// 批量导入题目（仅管理员）
router.post('/import', protect, admin, questionController.importQuestions);

// 预览导入内容（仅管理员）
router.post('/import/preview', protect, admin, questionController.previewImportQuestions);

// 通过 Excel/CSV 导入题目（仅管理员）
router.post('/import-file', protect, admin, upload.single('file'), questionController.importQuestionsFromFile);

// 预览 Excel/CSV 导入内容（仅管理员）
router.post('/import-file/preview', protect, admin, upload.single('file'), questionController.previewImportQuestionsFromFile);

// 获取题目列表
router.get('/', protect, questionController.getQuestions);

// 获取单个题目
router.get('/:id', protect, questionController.getQuestionById);

// 更新题目（仅管理员）
router.put('/:id', protect, admin, questionController.updateQuestion);

// 删除题目（仅管理员）
router.delete('/:id', protect, admin, questionController.deleteQuestion);

module.exports = router;
