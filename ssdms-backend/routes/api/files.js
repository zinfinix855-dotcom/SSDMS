const express = require('express');
const router = express.Router();
const { createAdmission, getFile, searchFiles, getSectionEntries, getFhirEncounter } = require('../../controllers/fileController');
const { protect, restrictToSection } = require('../../middlewares/auth');
const { auditLogger } = require('../../middlewares/auditLogger');
const validate = require('../../middlewares/validate');
const { admissionSchemas } = require('../../validations');

// NOTE: /admission MUST come before /:visitNumber to avoid route shadowing
router.post('/admission', protect, restrictToSection('Admission'), validate(admissionSchemas.create), auditLogger, createAdmission);
router.get('/:visitNumber/sections', protect, getSectionEntries);
router.get('/:visitNumber/fhir', protect, getFhirEncounter);
router.get('/:visitNumber', protect, getFile);
router.get('/', protect, searchFiles);

module.exports = router;
