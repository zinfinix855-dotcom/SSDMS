const express = require('express');
const router = express.Router();
const { forwardFile, overrideWorkflow, returnFile, bulkAction } = require('../../controllers/workflowController');
const { protect, restrictTo } = require('../../middlewares/auth');
const { auditLogger } = require('../../middlewares/auditLogger');
const validate = require('../../middlewares/validate');
const idempotency = require('../../middlewares/idempotency');
const setTenant = require('../../middlewares/setTenant');
const { workflowSchemas } = require('../../validations');

// setTenant must come AFTER protect (so req.user is populated) and BEFORE controllers
router.post('/forward',      protect, setTenant, idempotency, validate(workflowSchemas.forward),  auditLogger, forwardFile);
router.post('/return',       protect, setTenant, idempotency, validate(workflowSchemas.return),   auditLogger, returnFile);
router.post('/override',     protect, restrictTo('Admin'), setTenant, validate(workflowSchemas.override), auditLogger, overrideWorkflow);
router.post('/bulk-action',  protect, restrictTo('Admin', 'Moderator'), setTenant, validate(workflowSchemas.bulk), auditLogger, bulkAction);

module.exports = router;
