const fileService = require('../services/FileService');
const workflowService = require('../services/WorkflowService');
const summaryService = require('../services/SummaryService');
const fhirService = require('../services/FhirService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const BaseController = require('./BaseController');

/**
 * FileController
 * Orchestrates patient file lifecycle and workflow transitions.
 */
class FileController extends BaseController {
    /**
     * @desc    Create Admission File
     * @route   POST /api/files/admission
     */
    createAdmission = asyncHandler(async (req, res) => {
        const result = await fileService.createAdmission(req.body, req.user.employee_id);
        return this.success(res, result, 'File created successfully', 201);
    });

    /**
     * @desc    Get File by Visit Number
     * @route   GET /api/files/:visitNumber
     */
    getFile = asyncHandler(async (req, res) => {
        const { visitNumber } = req.params;
        const detail = await fileService.getFileDetail(visitNumber, req.user, req.ip);
        
        // Inject Smart Summary Narrative
        const narrative = await summaryService.getFileNarrative(visitNumber);
        detail.narrative = narrative;

        return this.success(res, detail, 'File detail retrieved');
    });

    /**
     * @desc    Search Files
     * @route   GET /api/files
     */
    searchFiles = asyncHandler(async (req, res) => {
        const result = await fileService.searchFiles(req.query, req.user, req.ip);
        const { files, total, page, limit } = result;

        return res.status(200).json({
            status: 'success',
            data: files,
            meta: { total, page, limit }
        });
    });

    /**
     * @desc    Get Section Entries for a file
     * @route   GET /api/files/:visitNumber/sections
     */
    getSectionEntries = asyncHandler(async (req, res) => {
        const { visitNumber } = req.params;
        const result = await fileService.getParsedSectionEntries(visitNumber);
        return this.success(res, result, 'Section archive entries retrieved');
    });

    /**
     * @desc    Get FHIR R4 Encounter resource
     * @route   GET /api/files/:visitNumber/fhir
     */
    getFhirEncounter = asyncHandler(async (req, res) => {
        const file = await fileService.getFileDetail(req.params.visitNumber, req.user, req.ip);
        const fhirEncounter = fhirService.mapToEncounter(file);
        
        if (!fhirEncounter) {
            throw new AppError('Failed to generate FHIR resource', 500);
        }

        return this.success(res, fhirEncounter, 'FHIR Resource generated');
    });

    /**
     * @desc    Complete a section/stage and auto-move file
     * @route   POST /api/files/:visitNumber/complete
     */
    completeSection = asyncHandler(async (req, res) => {
        const { visitNumber } = req.params;
        const { stage, data, remarks } = req.body;
        
        const result = await workflowService.processStageCompletion(
            visitNumber, 
            stage, 
            data, 
            remarks, 
            req.user.employee_id
        );
        return this.success(res, result, `Stage ${stage} completed successfully`);
    });
}

module.exports = new FileController();
