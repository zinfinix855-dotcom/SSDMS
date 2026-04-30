const workflowEngine = require('../../utils/WorkflowEngine');
const { STATUS } = require('../../utils/Constants');

describe('WorkflowEngine', () => {
    test('should return default next stage and in_progress status for normal flow', () => {
        const result = workflowEngine.getNextState('Admission');
        expect(result.nextStage).toBe('Discharge');
        expect(result.fileStatus).toBe(STATUS.IN_PROGRESS);
    });

    test('should handle Segregation "Objected" case', () => {
        const result = workflowEngine.getNextState('Segregation', { category: 'Objected' });
        expect(result.nextStage).toBe('E-Claim');
        expect(result.fileStatus).toBe(STATUS.OBJECTED);
    });

    test('should handle Segregation "Archive" case', () => {
        const result = workflowEngine.getNextState('Segregation', { category: 'Archive' });
        expect(result.nextStage).toBe('Record Room');
        expect(result.fileStatus).toBe(STATUS.ARCHIVED);
    });

    test('should handle Indexation completion', () => {
        const result = workflowEngine.getNextState('Indexation');
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
