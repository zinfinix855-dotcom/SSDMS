import API from '../api/axios';
import toast from 'react-hot-toast';

/**
 * WorkflowGateway
 * Centralized logic for file transitions across the 10-stage pipeline.
 * Ensures data integrity and consistent auditing during movement.
 */
export const WorkflowGateway = {
    /**
     * Authorize and forward file to the subsequent stage
     */
    forward: async (visitNumber, stage, data, remarks) => {
        const loading = toast.loading(`Authorizing ${stage} transition...`);
        try {
            const res = await API.post(`/files/${visitNumber}/complete`, {
                stage,
                data,
                remarks
            });
            toast.success(res.message || 'File transitioned successfully', { id: loading });
            return { success: true, data: res.data };
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gateway authorization failed', { id: loading });
            return { success: false, error: err };
        }
    },

    /**
     * Reverse flow: Return file to previous stage
     */
    return: async (visitNumber, remarks) => {
        const loading = toast.loading('Initiating reverse flow...');
        try {
            const res = await API.post(`/files/${visitNumber}/return`, { remarks });
            toast.success('Reverse flow authorized', { id: loading });
            return { success: true, data: res.data };
        } catch (err) {
            toast.error(err.response?.data?.message || 'Reverse flow denied', { id: loading });
            return { success: false, error: err };
        }
    }
};

export default WorkflowGateway;
