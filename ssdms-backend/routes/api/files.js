const express = require('express');
const router = express.Router();
const fileController = require('../../controllers/fileController');
const { protect, restrictToSection } = require('../../middlewares/auth');
const { auditLogger } = require('../../middlewares/auditLogger');
const validate = require('../../middlewares/validate');
const { admissionSchemas } = require('../../validations');

// NOTE: /admission MUST come before /:visitNumber to avoid route shadowing
router.post('/admission', protect, restrictToSection('Admission'), validate(admissionSchemas.create), auditLogger, fileController.createAdmission);
router.get('/:visitNumber/sections', protect, fileController.getSectionEntries);
router.get('/:visitNumber/fhir', protect, fileController.getFhirEncounter);
router.get('/:visitNumber', protect, fileController.getFile);
router.get('/', protect, fileController.searchFiles);

module.exports = router;
