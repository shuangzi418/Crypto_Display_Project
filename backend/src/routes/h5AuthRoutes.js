const express = require('express');
const h5AuthController = require('../h5/controllers/authController');
const { protectH5User } = require('../h5/middleware/auth');

const router = express.Router();

router.post('/access', h5AuthController.accessH5User);
router.post('/register', h5AuthController.registerH5User);
router.post('/login', h5AuthController.loginH5User);
router.get('/session', h5AuthController.getH5Session);
router.post('/award-records/query', h5AuthController.lookupAwardRecords);
router.get('/profile', protectH5User, h5AuthController.getH5Profile);
router.post('/logout', protectH5User, h5AuthController.logoutH5User);

module.exports = router;
