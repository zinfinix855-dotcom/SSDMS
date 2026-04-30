const fileService = require('../services/FileService');
const workflowService = require('../services/WorkflowService');
const summaryService = require('../services/SummaryService');
const fhirService = require('../services/FhirService');
const { sendSuccess, sendPaginated } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// @desc    Create Admission File
// @route   POST /api/files/admission
// @access  Private (Admission section)
const createAdmission = asyncHandler(async (req, res, next) => {
    const result = await fileService.createAdmission(req.body, req.user.employee_id);
    return sendSuccess(res, result, 'File created successfully', 201);
});

// @desc    Get File by Visit Number (also supports ssc_visit_number lookup)
// @route   GET /api/files/:visitNumber
// @access  Private
const getFile = asyncHandler(async (req, res, next) => {
    const { visitNumber } = req.params;
    const detail = await fileService.getFileDetail(visitNumber, req.user, req.ip);
    
    // Phase 6: Inject Smart Summary
    const narrative = await summaryService.getFileNarrative(visitNumber);
    detail.narrative = narrative;

    return sendSuccess(res, detail, 'File detail retrieved');
});

// @desc    Search Files (by visit_number, ssc_visit_number, cnic, patient_name, status)
// @route   GET /api/files
// @access  Private
const searchFiles = asyncHandler(async (req, res, next) => {
    const result = await fileService.searchFiles(req.query, req.user, req.ip);
    const { files, total, page, limit } = result;

    return sendPaginated(res, files, page, limit, total, 'Search results retrieved');
});

// @desc    Get Section Entries for a file (by stage)
// @route   GET /api/files/:visitNumber/sections
// @access  Private
const getSectionEntries = asyncHandler(async (req, res, next) => {
    const { visitNumber } = req.params;
    const result = await fileService.getParsedSectionEntries(visitNumber);

    return sendSuccess(res, result, 'Section archive entries retrieved');
});

// @desc    Get FHIR R4 Encounter resource for a file
// @route   GET /api/files/:visitNumber/fhir
// @access  Private
const getFhirEncounter = asyncHandler(async (req, res, next) => {
    const file = await fileService.getFileDetail(req.params.visitNumber, req.user, req.ip);
    const fhirEncounter = fhirService.mapToEncounter(file);
    
    if (!fhirEncounter) {
        throw new AppError('Failed to generate FHIR resource', 500);
    }

    return sendSuccess(res, fhirEncounter, 'FHIR Resource generated');
});

// @desc    Complete a section/stage and auto-move file
// @route   POST /api/files/:visitNumber/complete
// @access  Private (Stage-specific)
const completeSection = asyncHandler(async (req, res, next) => {
    const { visitNumber } = req.params;
    const { stage, data } = req.body;
    
    const result = await workflowService.processStageCompletion(visitNumber, stage, data, req.user.employee_id);
    return sendSuccess(res, result, `Stage ${stage} completed and file moved successfully`);
});

module.exports = {
    createAdmission,
    getFile,
    searchFiles,
    getSectionEntries,
    getFhirEncounter,
    completeSection
};
