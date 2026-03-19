const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// 注册路由
router.post('/register',
  [
    body('username', 'Username is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  userController.registerUser
);

// 登录路由
router.post('/login', userController.loginUser);

// 获取用户个人资料路由
router.get('/profile', protect, userController.getUserProfile);

// 更新用户个人资料路由
router.put('/profile', protect, userController.updateUserProfile);

// 刷新令牌路由
router.post('/refresh-token', userController.refreshToken);

// 登出路由
router.post('/logout', protect, userController.logout);

// 密码找回路由
router.post('/forgot-password', userController.forgotPassword);

// 重置密码路由
router.post('/reset-password', userController.resetPassword);

// 获取所有用户列表（暂时移除认证要求，用于测试）
router.get('/', protect, admin, userController.getUsers);
// 修改用户角色（管理员专用）
router.put('/:id/role', protect, admin, userController.updateUserRole);

// 更新个人设置（头像和昵称）
router.put('/settings', protect, userController.updateUserSettings);

// 审核用户昵称（管理员专用）
router.post('/nickname/approve', protect, admin, userController.approveNickname);
// 获取待审核的用户昵称（管理员专用）
router.get('/nickname/pending', protect, admin, userController.getPendingNicknames);

// 审核用户头像（管理员专用）
router.post('/avatar/approve', protect, admin, userController.approveAvatar);
// 获取待审核的用户头像（管理员专用）
router.get('/avatar/pending', protect, admin, userController.getPendingAvatars);

module.exports = router;
