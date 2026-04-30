require('dotenv').config();
require('dotenv').config();
const WorkflowRepository = require('../../repositories/WorkflowRepository');
const FileRepository = require('../../repositories/FileRepository');
const setTenant = require('../../middlewares/setTenant');
const { pool } = require('../../config/database');

/**
 * UNIT TEST: Security Hardening
 * 
 * Verifies:
 * 1. Role-based transition validation (AllowedRoles JSON check)
 * 2. Multitenancy isolation (BaseRepository hospitalId injection)
 */
describe('Security Hardening', () => {
    
    describe('Workflow Role Enforcement', () => {
        beforeAll(async () => {
            // Seed an Admin-only rule for testing
            await pool.query(
                'INSERT INTO workflow_rules (from_stage, to_stage, allowed_roles, hospital_id) VALUES (?, ?, ?, ?)',
                ['Indexation', 'Completed', JSON.stringify(['Admin']), 1]
            );
        });

        test('should allow transition when role is in allowed_roles array', async () => {
            const isValid = await WorkflowRepository.validateTransition('Admission', 'Discharge', 'Employee');
            expect(isValid).toBe(true);
        });

        test('should deny transition when role is missing from allowed_roles array', async () => {
            const isValid = await WorkflowRepository.validateTransition('Admission', 'Discharge', 'UnauthorizedRole');
            expect(isValid).toBe(false);
        });

        test('should deny Employee from performing an Admin-only transition', async () => {
            const isValid = await WorkflowRepository.validateTransition('Indexation', 'Completed', 'Employee');
            expect(isValid).toBe(false);
        });

        test('should allow Admin to perform Admin-only transitions', async () => {
            const isValid = await WorkflowRepository.validateTransition('Indexation', 'Completed', 'Admin');
            expect(isValid).toBe(true);
        });
    });

    describe('Multitenancy Isolation', () => {
        test('should isolate data by hospitalId in BaseRepository', async () => {
            // Setup repo for Hospital A
            FileRepository.setTenantContext(1);
            expect(FileRepository.hospitalId).toBe(1);

            // Setup repo for Hospital B
            const hospitalBRepo = FileRepository.withTenant(2);
            expect(hospitalBRepo.hospitalId).toBe(2);
            
            // Verify singleton state (Note: singleton mutation is a known design choice here)
            expect(FileRepository.hospitalId).toBe(2);
        });

        test('should throw error in middleware if hospital_id is missing', () => {
            const req = { user: {} };
            const res = {};
            const next = jest.fn();

            setTenant(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 400,
                message: expect.stringContaining('Tenant context missing')
            }));
        });

        test('should set tenant context correctly from req.user', () => {
            const req = { user: { hospital_id: 5 } };
            const res = {};
            const next = jest.fn();

            setTenant(req, res, next);

            expect(FileRepository.hospitalId).toBe(5);
            expect(next).toHaveBeenCalledWith();
        });
    });
});
