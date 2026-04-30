import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import FileService from '../services/FileService';
import WorkflowService from '../services/WorkflowService';
import { STAGES } from '../constants/stages';

export default function useStageWorkflow(stageName) {
    const [fileData, setFileData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchFile = useCallback(async (visitNumber) => {
        setLoading(true);
        try {
            const data = await FileService.getDetail(visitNumber);
            const file = data.file;
            if (file.current_stage !== stageName) {
                toast.error(`File is at ${file.current_stage}, not ${stageName}.`);
                return null;
            }
            setFileData(file);
            return file;
        } catch {
            toast.error('File not found or unauthorized.');
            return null;
        } finally {
            setLoading(false);
        }
    }, [stageName]);

    const forwardFile = async (formData, remarks, isNewAdmission) => {
        setSubmitting(true);
        try {
            if (isNewAdmission && stageName === 'Admission') {
                await FileService.createAdmission(formData);
                toast.success('New Patient Admitted Successfully');
                return true;
            } else {
                if (!fileData) return false;
                // Pro Upgrade: Atomic Save + Auto-Move
                await WorkflowService.complete(fileData.visit_number, stageName, formData);
                toast.success(`Submission complete! File automatically moved to the next stage.`);
                setFileData(null);
                return true;
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Action failed');
            return false;
        } finally {
            setSubmitting(false);
        }
    };

    const returnFile = async (remarks) => {
        if (!fileData || !remarks) {
            toast.error('Please provide remarks for return');
            return false;
        }
        setSubmitting(true);
        try {
            const currIdx = STAGES.indexOf(stageName);
            const prevStage = currIdx > 0 ? STAGES[currIdx - 1] : STAGES[0];
            await WorkflowService.return(fileData.visit_number, prevStage, remarks);
            toast.success(`File returned to ${prevStage}`);
            setFileData(null);
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to return file');
            return false;
        } finally {
            setSubmitting(false);
        }
    };

    return {
        fileData,
        setFileData,
        loading,
        submitting,
        fetchFile,
        forwardFile,
        returnFile
    };
}
