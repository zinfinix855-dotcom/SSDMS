const express = require('express');
const router = express.Router();
const { getFileSplits, approveSplits } = require('../../controllers/financeController');
const { protect, restrictTo } = require('../../middlewares/auth');
const { auditLogger } = require('../../middlewares/auditLogger');

router.get('/:visitNumber', protect, getFileSplits);
router.post('/:visitNumber/approve', protect, restrictTo('Admin'), auditLogger, approveSplits);

module.exports = router;
