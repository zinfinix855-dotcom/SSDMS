const express = require('express');
const router = express.Router();
const { login, getMe, refreshToken, logout, setupPassword } = require('../../controllers/authController');
const { protect } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { authSchemas } = require('../../validations');
const { authLimiter } = require('../../middlewares/rateLimiter');

router.post('/login', authLimiter, validate(authSchemas.login), login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken); // No authLimiter — interceptor auto-retry would exhaust the limit
router.post('/setup-password', protect, setupPassword);
router.get('/me', protect, getMe);

module.exports = router;
