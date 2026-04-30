const express = require('express');
const router = express.Router();
const { getUsers, createUser, resetPassword, updateUser } = require('../../controllers/userController');
const { protect, restrictTo } = require('../../middlewares/auth');
const { auditLogger } = require('../../middlewares/auditLogger');
const validate = require('../../middlewares/validate');
const { userSchemas } = require('../../validations');

router.get('/', protect, restrictTo('Admin', 'Moderator'), getUsers);
router.post('/', protect, restrictTo('Admin'), validate(userSchemas.create), auditLogger, createUser);
// /reset-password MUST come before /:id to avoid route shadowing
router.post('/reset-password', protect, restrictTo('Admin'), auditLogger, resetPassword);
router.put('/:id', protect, restrictTo('Admin'), validate(userSchemas.update), auditLogger, updateUser);

module.exports = router;
