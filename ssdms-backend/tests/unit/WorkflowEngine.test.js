const workflowEngine = require('../../utils/WorkflowEngine');
const { STATUS } = require('../../utils/Constants');

jest.mock('../../repositories/WorkflowRepository', () => ({
    getValidTransitions: jest.fn((fromStage) => {
        const transitions = {
            'Admission': [{ to_stage: 'Discharge' }],
            'Discharge': [{ to_stage: 'Pre-Approval' }],
            'Segregation': [{ to_stage: 'Indexation' }],
            'Indexation': [{ to_stage: 'Record Room' }],
        };
        return Promise.resolve(transitions[fromStage] || []);
    })
}));

describe('WorkflowEngine', () => {
    test('should return default next stage and in_progress status for normal flow', async () => {
        const result = await workflowEngine.getNextState('Admission');
        expect(result.nextStage).toBe('Discharge');
        expect(result.fileStatus).toBe(STATUS.IN_PROGRESS);
    });

    test('should handle Segregation "Objected" case', async () => {
        const result = await workflowEngine.getNextState('Segregation', { category: 'Objected' });
        expect(result.nextStage).toBe('E-Claim');
        expect(result.fileStatus).toBe(STATUS.OBJECTED);
    });

    test('should handle Segregation "Archive" case', async () => {
        const result = await workflowEngine.getNextState('Segregation', { category: 'Archive' });
        expect(result.nextStage).toBe('Record Room');
        expect(result.fileStatus).toBe(STATUS.ARCHIVED);
    });

    test('should handle Indexation completion', async () => {
        const result = await workflowEngine.getNextState('Indexation');
        expect(result.nextStage).toBe('Record Room');
        expect(result.fileStatus).toBe(STATUS.COMPLETED);
    });

    test('should return no hooks for Admission', () => {
        const hooks = workflowEngine.getHooks('Admission');
        expect(hooks.afterUpdate).toBeNull();
    });

    test('should return afterUpdate hook for Finance', () => {
        const hooks = workflowEngine.getHooks('Finance');
        expect(typeof hooks.afterUpdate).toBe('function');
    });
});
