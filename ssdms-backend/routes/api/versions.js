const express = require('express');
const router = express.Router();
const { getVersionHistory } = require('../../controllers/versionController');
const { protect } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { commonSchemas } = require('../../validations');

router.use(protect);

router.get('/:visitNumber',
    validate(commonSchemas.visitNumber, 'params'),
    getVersionHistory
);

module.exports = router;
