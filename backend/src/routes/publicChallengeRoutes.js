const express = require('express');
const publicChallengeController = require('../controllers/publicChallengeController');
const { protectH5User } = require('../h5/middleware/auth');

const router = express.Router();

router.get('/national-security', protectH5User, publicChallengeController.getNationalSecurityChallenge);
router.post('/national-security/submit', protectH5User, publicChallengeController.submitNationalSecurityChallenge);

module.exports = router;
