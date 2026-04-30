const WorkflowRepository = require('../repositories/WorkflowRepository');
const { STATUS } = require('./Constants');

class WorkflowEngine {
    async getNextState(currentStage, data = {}) {
        let nextStage = null;
        let fileStatus = STATUS.IN_PROGRESS;

        // Fetch valid transitions from DB
        const transitions = await WorkflowRepository.getValidTransitions(currentStage);
        if (transitions && transitions.length > 0) {
            nextStage = transitions[0].to_stage; // Default to first available route
        }

        // Stage-specific overrides
        switch (currentStage) {
            case 'Segregation':
                if (data.category === 'Objected') {
                    nextStage = 'E-Claim';
                    fileStatus = STATUS.OBJECTED;
                } else if (data.category === 'Fresh') {
                    nextStage = 'E-Claim';
                    fileStatus = STATUS.IN_PROGRESS;
                } else if (data.category === 'Archive') {
                    nextStage = 'Record Room';
                    fileStatus = STATUS.ARCHIVED;
                }
                break;

            case 'Indexation':
                nextStage = 'Record Room';
                fileStatus = STATUS.COMPLETED;
                break;

            case 'Finance':
                // Finance moves to Segregation normally, handled by STAGE_FLOW
                break;

            default:
                break;
        }

        return { nextStage, fileStatus };
    }

    /**
     * Check if a stage has specific hooks (like database updates)
     */
    getHooks(currentStage) {
        const hooks = {
            beforeUpdate: null,
            afterUpdate: null
        };

        if (currentStage === 'Finance') {
            hooks.afterUpdate = async (fileRepository, visitNumber, data, connection) => {
                if (data.splits) {
                    await fileRepository.addFinanceSplits(visitNumber, data.splits, connection);
                }
            };
        }

        return hooks;
    }
}

module.exports = new WorkflowEngine();
