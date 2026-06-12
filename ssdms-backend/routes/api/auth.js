const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authController');
const { protect } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { authSchemas } = require('../../validations');
const { authLimiter } = require('../../middlewares/rateLimiter');

router.post('/login', authLimiter, validate(authSchemas.login), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken); 
router.post('/setup-password', protect, authController.setupPassword);
router.get('/me', protect, authController.getMe);

module.exports = router;
