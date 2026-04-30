import API from '../api/axios';

const WorkflowService = {
    forward: async (visitNumber, currentStage, data, remarks) => {
        const response = await API.post('/workflow/forward', {
            visit_number: visitNumber,
            current_stage: currentStage,
            data,
            remarks
        });
        return response.data;
    },

    complete: async (visitNumber, stage, data) => {
        const response = await API.post(`/files/${visitNumber}/complete`, {
            stage,
            data
        });
        return response.data;
    },

    return: async (visitNumber, returnToStage, remarks) => {
        const response = await API.post('/workflow/return', {
            visit_number: visitNumber,
            return_to_stage: returnToStage,
            remarks
        });
        return response.data;
    },

    override: async (visitNumber, targetStage, reason) => {
        const response = await API.post('/workflow/override', {
            visit_number: visitNumber,
            target_stage: targetStage,
            reason
        });
        return response.data;
    },

    bulkAction: async (visitNumbers, action, remarks) => {
        const response = await API.post('/workflow/bulk-action', {
            visit_numbers: visitNumbers,
            action,
            remarks
        });
        return response.data;
    }
};

export default WorkflowService;
