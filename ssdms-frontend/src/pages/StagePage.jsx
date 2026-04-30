import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import {
    FileCheck, History, ArrowRightCircle,
    Stethoscope, Zap, ArrowLeftCircle, LayoutList, Pencil, ShieldCheck
} from 'lucide-react';
import StageProgress from '../components/StageProgress';
import SectionHistory from '../components/SectionHistory';
import ConfirmDialog from '../components/common/ConfirmDialog';
import StageFileList from '../components/workflow/StageFileList';
import useStageWorkflow from '../hooks/useStageWorkflow';
import useSocket from '../hooks/useSocket';
import { STAGES } from '../constants/stages';
import toast from 'react-hot-toast';

// Workflow form sub-components
import SearchHero from '../components/workflow/SearchHero';
import AdmissionForm from '../components/workflow/AdmissionForm';
import FinanceForm from '../components/workflow/FinanceForm';
import SegregationForm from '../components/workflow/SegregationForm';
import VerificationForm from '../components/workflow/VerificationForm';

export default function StagePage() {
    const { stageName } = useParams();
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({});
    const [remarks, setRemarks] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [isNewAdmission, setIsNewAdmission] = useState(false);
    const [view, setView] = useState('list');
    const [confirm, setConfirm] = useState(null);

    const {
        fileData,
        setFileData,
        loading,
        submitting,
        fetchFile,
        forwardFile,
        returnFile
    } = useStageWorkflow(stageName);

    // Reset all state when the stage changes
    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect */
        setFileData(null);
        setSearchTerm('');
        setFormData({});
        setRemarks('');
        setIsNewAdmission(stageName === 'Admission');
        setView('list');
        setConfirm(null);
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [stageName, setFileData]);

    const handleSelectFromList = async (visitNumber) => {
        setSearchTerm(visitNumber);
        setView('workspace');
        await fetchFile(visitNumber);
    };

    useSocket(useCallback((event) => {
        const { type } = event;
        // Auto-refresh the list view on any relevant movement if we are in list view
        if (['FILE_FORWARDED', 'FILE_RETURNED', 'BULK_ACTION_COMPLETED', 'WORKFLOW_OVERRIDDEN'].includes(type)) {
            if (view === 'list') {
                 setSearchTerm('');
            }
        }
    }, [view]), { stage: stageName });

    const handleSearch = async (e) => {
        e?.preventDefault();
        if (!searchTerm) return;
        setIsNewAdmission(false);
        const file = await fetchFile(searchTerm);
        if (file) {
            setFormData({});
        }
    };

    const handleForwardRequest = async () => {
        if (stageName === 'Segregation' && !formData.category) {
            return toast.error('Please select a category (Fresh / Objected / Archive)');
        }
        if (stageName === 'Finance' && (!formData.splits || formData.splits.length === 0)) {
            return toast.error('Please add at least one finance split record');
        }

        const success = await forwardFile(formData, remarks, isNewAdmission);
        if (success) {
            setFormData({});
            setRemarks('');
            setSearchTerm('');
            setView('list');
        }
    };

    const handleReturnRequest = async () => {
        const success = await returnFile(remarks);
        if (success) {
            setSearchTerm('');
            setView('list');
        }
    };

    return (
        <Layout title={`${stageName} Portal`}>
            <div className="animate-fade-in">

                {/* ── Premium Stage Hero ── */}
                <div className="stage-hero mb-4 shadow-sm" style={{ padding: '1.5rem 2rem' }}>
                    <div className="stage-hero-orb" style={{ top: '-40px', right: '-40px' }} />
                    <div className="stage-hero-orb" style={{ bottom: '-80px', left: '-80px', width: '160px', height: '160px', background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)' }} />
                    
                    <div className="position-relative z-index-1">
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)' }}>
                                <Stethoscope size={18} className="text-white" />
                            </div>
                            <span className="badge rounded-pill px-2 py-1 fw-800" style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.2)', fontSize: '8px', letterSpacing: '0.5px' }}>
                                LIVE WORKFLOW PORTAL
                            </span>
                        </div>
                        <div className="row align-items-center">
                            <div className="col-lg-8">
                                <h1 className="fw-900 mb-1 tracking-tighter text-white" style={{ fontSize: '1.75rem' }}>{stageName} Section</h1>
                                <p className="extra-small opacity-75 mb-0 fw-500 text-white">
                                    Managing active hospital department processes with real-time tracking and SLA enforcement.
                                </p>
                            </div>
                            <div className="col-lg-4 d-flex justify-content-lg-end mt-3 mt-lg-0">
                                <div className="workspace-nav">
                                    <button 
                                        className={`workspace-nav-btn ${view === 'list' ? 'active' : ''}`}
                                        onClick={() => { setView('list'); setFileData(null); setIsNewAdmission(false); }}
                                        style={{ padding: '6px 12px', fontSize: '10px' }}
                                    >
                                        <LayoutList size={12} className="me-1" /> QUEUE
                                    </button>
                                    <button 
                                        className={`workspace-nav-btn ${view === 'workspace' ? 'active' : ''}`}
                                        onClick={() => setView('workspace')}
                                        style={{ padding: '6px 12px', fontSize: '10px' }}
                                    >
                                        <Pencil size={12} className="me-1" /> WORKSPACE
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── QUEUE VIEW ── */}
                {view === 'list' && (
                    <StageFileList stageName={stageName} onSelectFile={handleSelectFromList} />
                )}

                {/* ── FILE WORKSPACE VIEW ── */}
                {view === 'workspace' && (
                    <>
                        <div className="mb-5">
                            <SearchHero
                                stageName={stageName}
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                handleSearch={handleSearch}
                                loading={loading}
                                isNewAdmission={isNewAdmission}
                                setIsNewAdmission={setIsNewAdmission}
                                setFileData={setFileData}
                            />
                        </div>

                        {!fileData && !isNewAdmission ? (
                            <div className="text-center py-5 glass-card bg-white border-0 shadow-sm">
                                <div className="p-4 bg-primary bg-opacity-5 rounded-pill d-inline-block mb-4">
                                    <Stethoscope size={48} className="text-primary opacity-50" />
                                </div>
                                <h5 className="text-dark fw-800 mb-2">No File in Workspace</h5>
                                <p className="text-muted small mx-auto" style={{ maxWidth: '400px' }}>
                                    Search for a specific Visit ID or SSC Number to initiate processing, or browse the active queue.
                                </p>
                                <button className="btn btn-primary rounded-pill px-5 mt-4 fw-800 shadow-lg" onClick={() => setView('list')}>
                                    <LayoutList size={14} className="me-2" /> Browse Active Queue
                                </button>
                            </div>
                        ) : (
                            <div className="row g-4">
                                {/* ── Left: Workspace ── */}
                                <div className="col-12 col-xl-8">
                                    <div className="glass-card mb-4 overflow-hidden border-0 shadow-sm bg-white">
                                        {/* Status Identifier Bar */}
                                        <div className="p-4 bg-primary bg-opacity-5 border-bottom d-flex justify-content-between align-items-center">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="p-2 rounded bg-primary text-white shadow-sm">
                                                    <Zap size={18} />
                                                </div>
                                                <h5 className="mb-0 fw-800 text-dark">
                                                    {isNewAdmission ? 'New Admission Registration' : `Active File: ${fileData?.visit_number}`}
                                                </h5>
                                            </div>
                                            {!isNewAdmission && fileData && (
                                                <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary px-3 py-2 fw-800 border border-primary border-opacity-10">
                                                    STATUS: {fileData.status?.toUpperCase()}
                                                </span>
                                            )}
                                        </div>

                                        {/* Patient Identity Snapshot */}
                                        {!isNewAdmission && fileData && (
                                            <div className="p-4 border-bottom bg-light bg-opacity-50">
                                                <div className="row g-4">
                                                    <div className="col-md-3">
                                                        <label className="text-muted extra-small fw-800 text-uppercase tracking-widest mb-1 d-block">PATIENT IDENTITY</label>
                                                        <div className="fw-800 text-dark">{fileData.patient_name}</div>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <label className="text-muted extra-small fw-800 text-uppercase tracking-widest mb-1 d-block">ACCOUNT NO</label>
                                                        <div className="fw-800 text-dark">{fileData.mr_number || 'NOT ASSIGNED'}</div>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <label className="text-muted extra-small fw-800 text-uppercase tracking-widest mb-1 d-block">IDENTIFIER (CNIC)</label>
                                                        <div className="fw-800 text-dark">{fileData.cnic}</div>
                                                    </div>
                                                    <div className="col-md-3 d-flex justify-content-end align-items-center">
                                                        <button className="btn btn-sm btn-white border shadow-sm rounded-pill px-3 fw-700 d-flex align-items-center gap-2" onClick={() => setShowHistory(true)}>
                                                            <History size={14} className="text-primary" /> AUDIT LOGS
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Workflow Input Area */}
                                        <div className="p-5">
                                            <h6 className="fw-900 mb-5 d-flex align-items-center gap-2 text-dark">
                                                <div className="p-1 rounded-circle bg-success bg-opacity-10">
                                                    <FileCheck size={20} className="text-success" />
                                                </div>
                                                SECTION PROCESSING GATEWAY
                                            </h6>

                                            <div className="row g-4 mb-5">
                                                {isNewAdmission ? (
                                                    <AdmissionForm formData={formData} setFormData={setFormData} />
                                                ) : stageName === 'Finance' ? (
                                                    <FinanceForm formData={formData} setFormData={setFormData} />
                                                ) : stageName === 'Segregation' ? (
                                                    <SegregationForm formData={formData} onChange={(d) => setFormData(d)} />
                                                ) : (
                                                    <div className="col-12">
                                                        <VerificationForm formData={formData} onChange={(d) => setFormData(d)} />
                                                    </div>
                                                )}

                                                <div className="col-12 mt-5">
                                                    <label className="form-label fw-800 extra-small text-muted tracking-widest">SUBMISSION REMARKS / HANDOVER NOTES</label>
                                                    <textarea
                                                        className="form-control rounded-4 border-0 bg-light p-4 fw-600"
                                                        rows="4"
                                                        placeholder="Enter critical observations for the next departmental operative..."
                                                        value={remarks}
                                                        onChange={(e) => setRemarks(e.target.value)}
                                                        style={{ resize: 'none' }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Action Execution Toolbar */}
                                            <div className="d-flex flex-wrap justify-content-end gap-3 pt-4 border-top">
                                                {!isNewAdmission && STAGES.indexOf(stageName) > 0 && (
                                                    <button
                                                        className="btn btn-lg btn-white text-danger border shadow-sm rounded-pill px-5 fw-800 d-flex align-items-center gap-2"
                                                        onClick={() => setConfirm({ type: 'return', handler: handleReturnRequest })}
                                                        disabled={submitting}
                                                        style={{ fontSize: 13 }}
                                                    >
                                                        <ArrowLeftCircle size={20} /> REVERSE FLOW
                                                    </button>
                                                )}
                                                <button
                                                    className="btn btn-lg btn-light rounded-pill px-4 fw-800 text-muted"
                                                    onClick={() => { setFileData(null); setIsNewAdmission(false); setView('list'); }}
                                                    style={{ fontSize: 13 }}
                                                >
                                                    EXIT WORKSPACE
                                                </button>
                                                <button
                                                    className="premium-btn py-3 px-5 d-flex align-items-center gap-3 shadow-xl"
                                                    onClick={() => setConfirm({ type: 'forward', handler: handleForwardRequest })}
                                                    disabled={submitting}
                                                    style={{ fontSize: 13, borderRadius: '999px' }}
                                                >
                                                    {submitting ? 'VALIDATING...' : (
                                                        <>
                                                            {isNewAdmission ? 'EXECUTE ADMISSION' : 'AUTHORIZE & FORWARD'}
                                                            <ArrowRightCircle size={20} />
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Right: Compliance & Protocol ── */}
                                <div className="col-12 col-xl-4">
                                    <div className="protocol-monitor shadow-sm border-0">
                                        <div className="d-flex align-items-center gap-3 mb-4">
                                            <div className="p-2 rounded-3 bg-dark text-white shadow-sm">
                                                <ShieldCheck size={20} />
                                            </div>
                                            <h6 className="fw-900 mb-0 text-dark">OPERATIONAL PROTOCOL</h6>
                                        </div>
                                        
                                        <div className="mb-5 p-4 rounded-4 bg-light border border-dashed text-center">
                                            <div className="extra-small fw-800 text-muted mb-3 tracking-widest">PROGRESS MONITOR</div>
                                            <StageProgress currentStage={stageName} />
                                        </div>

                                        <div className="protocol-step">
                                            <div className="fw-800 text-primary mb-1 text-uppercase tracking-tighter">Identity Verification</div>
                                            <p className="mb-0 text-muted small fw-500">Cross-reference physical documentation with system registry identifiers.</p>
                                        </div>

                                        <div className="protocol-step" style={{ borderLeftColor: '#10b981' }}>
                                            <div className="fw-800 text-success mb-1 text-uppercase tracking-tighter">SLA Adherence</div>
                                            <p className="mb-0 text-muted small fw-500">Current section occupancy is within optimal processing parameters.</p>
                                        </div>

                                        <div className="mt-4 p-4 rounded-4 bg-primary bg-opacity-5 border border-primary border-opacity-10">
                                            <h6 className="fw-800 text-primary extra-small tracking-widest mb-2">DYNAMIC GUIDELINE</h6>
                                            <p className="text-muted small fw-600 mb-0">
                                                {stageName === 'Admission'
                                                    ? 'Verify the SSC card manually and ensure the visit number matches exactly with the hospital HIS output.'
                                                    : stageName === 'Finance'
                                                        ? 'All financial splits are audited. Discrepancies will trigger an immediate audit flag.'
                                                        : 'Please ensure all scanned attachments are legible before forwarding to the subsequent department.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── Confirm Dialog ── */}
            {confirm && (
                <ConfirmDialog
                    isOpen
                    onClose={() => setConfirm(null)}
                    onConfirm={async () => {
                        const handler = confirm.handler;
                        setConfirm(null);
                        await handler();
                    }}
                    title={confirm.type === 'forward' ? 'Confirm Forward' : 'Confirm Return'}
                    message={
                        confirm.type === 'forward'
                            ? `Forward file ${fileData?.visit_number} to the next stage? This action cannot be undone.`
                            : `Return file ${fileData?.visit_number} to the previous stage?`
                    }
                    confirmLabel={confirm.type === 'forward' ? 'Forward File' : 'Return File'}
                    variant={confirm.type === 'forward' ? 'primary' : 'danger'}
                    loading={submitting}
                />
            )}

            {/* ── File History Panel ── */}
            {showHistory && (
                <SectionHistory
                    visitNumber={fileData?.visit_number}
                    onClose={() => setShowHistory(false)}
                />
            )}
        </Layout>
    );
}
