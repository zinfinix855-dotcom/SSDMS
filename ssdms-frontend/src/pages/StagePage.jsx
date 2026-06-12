import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import {
    FileCheck, History, ArrowRightCircle,
    Stethoscope, Zap, ArrowLeftCircle, LayoutList, Pencil, ShieldCheck, Search
} from 'lucide-react';
import SectionHistory from '../components/SectionHistory';
import StageFileList from '../components/workflow/StageFileList';
import useStageWorkflow from '../hooks/useStageWorkflow';
import useSocket from '../hooks/useSocket';
import { STAGES } from '../constants/stages';
import toast from 'react-hot-toast';
import PageTransition from '../components/common/PageTransition';

// Workflow form sub-components
import AdmissionForm from '../components/workflow/AdmissionForm';
import FinanceForm from '../components/workflow/FinanceForm';
import SegregationForm from '../components/workflow/SegregationForm';
import VerificationForm from '../components/workflow/VerificationForm';

export default function StagePage() {
    const { stageName } = useParams();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({});
    const [remarks, setRemarks] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [isNewAdmission, setIsNewAdmission] = useState(false);
    const [view, setView] = useState('list');

    const {
        fileData,
        setFileData,
        loading,
        submitting,
        fetchFile,
        forwardFile,
        returnFile
    } = useStageWorkflow(stageName);

    useEffect(() => {
        setFileData(null);
        setSearchTerm('');
        setFormData({});
        setRemarks('');
        setIsNewAdmission(stageName === 'Admission');
        setView('list');
    }, [stageName, setFileData]);

    const handleSelectFromList = async (visitNumber) => {
        setSearchTerm(visitNumber);
        setView('workspace');
        await fetchFile(visitNumber);
    };

    useSocket(useCallback((event) => {
        if (['FILE_FORWARDED', 'FILE_RETURNED', 'BULK_ACTION_COMPLETED'].includes(event.type)) {
            if (view === 'list') fetchStats?.(); // Refresh queue if visible
        }
    }, [view]), { stage: stageName });

    const handleForwardRequest = async () => {
        const success = await forwardFile(formData, remarks, isNewAdmission);
        if (success) {
            toast.success('File processed successfully.');
            setView('list');
        }
    };

    return (
        <Layout title={`${stageName} Operations`}>
            <PageTransition>
                <div className="d-flex flex-column gap-8">
                
                {/* ── Workflow Header ── */}
                <div className="zenith-card p-6 bg-card d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-4">
                        <div className="icon-badge-sm">
                            <Stethoscope size={18} />
                        </div>
                        <div>
                            <h2 className="m-0 display-font" style={{ fontSize: '20px' }}>{stageName} Workspace</h2>
                            <p className="m-0 text-dim extra-small fw-700">DEPARTMENTAL PROCESSING GATEWAY</p>
                        </div>
                    </div>
                    <div className="workspace-toggle">
                        <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
                            <LayoutList size={14} /> QUEUE
                        </button>
                        <button className={view === 'workspace' ? 'active' : ''} onClick={() => setView('workspace')}>
                            <Pencil size={14} /> WORKSPACE
                        </button>
                    </div>
                </div>

                {view === 'list' ? (
                    <div className="animate-slide-in">
                        <StageFileList stageName={stageName} onSelectFile={handleSelectFromList} />
                    </div>
                ) : (
                    <div className="row g-8 animate-slide-in">
                        {/* ── Primary Workspace ── */}
                        <div className="col-12 col-xl-8">
                            <div className="zenith-card p-0 overflow-hidden">
                                <div className="p-6 border-bottom border-light bg-card d-flex justify-content-between align-items-center">
                                    <h4 className="m-0 text-main" style={{ fontSize: '16px' }}>
                                        {isNewAdmission ? 'New Registration' : `Processing: ${fileData?.visit_number || 'Search Required'}`}
                                    </h4>
                                    {!isNewAdmission && fileData && <span className="badge-premium">{fileData.status}</span>}
                                </div>

                                {!fileData && !isNewAdmission ? (
                                    <div className="p-12 text-center">
                                        <div className="search-box-large mb-6">
                                            <Search size={24} />
                                            <input 
                                                type="text" 
                                                placeholder="Enter Visit ID / SSC Number..." 
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                                onKeyPress={e => e.key === 'Enter' && fetchFile(searchTerm)}
                                            />
                                        </div>
                                        <p className="text-dim extra-small fw-700">INPUT IDENTIFIER TO INITIALIZE WORKSPACE</p>
                                    </div>
                                ) : (
                                    <div className="p-8">
                                        <div className="d-flex flex-column gap-10">
                                            {/* Dynamic Form Injection */}
                                            <div className="form-section">
                                                {isNewAdmission ? (
                                                    <AdmissionForm formData={formData} setFormData={setFormData} />
                                                ) : stageName === 'Finance' ? (
                                                    <FinanceForm formData={formData} setFormData={setFormData} />
                                                ) : stageName === 'Segregation' ? (
                                                    <SegregationForm formData={formData} onChange={setFormData} />
                                                ) : (
                                                    <VerificationForm formData={formData} onChange={setFormData} />
                                                )}
                                            </div>

                                            <div className="remarks-section">
                                                <label className="extra-small fw-800 text-dim tracking-widest mb-4 d-block">OPERATION NOTES</label>
                                                <textarea 
                                                    className="zenith-input w-100" 
                                                    rows="4" 
                                                    placeholder="Record critical handover observations..."
                                                    value={remarks}
                                                    onChange={e => setRemarks(e.target.value)}
                                                />
                                            </div>

                                            <div className="d-flex justify-content-end gap-4 pt-8 border-top border-light">
                                                <button className="btn-secondary-zenith" onClick={() => setView('list')}>EXIT</button>
                                                <button className="premium-btn" onClick={handleForwardRequest} disabled={submitting}>
                                                    {submitting ? 'EXECUTING...' : 'AUTHORIZE & FORWARD'} <ArrowRightCircle size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Protocol & Context ── */}
                        <div className="col-12 col-xl-4">
                            <div className="d-flex flex-column gap-6">
                                <div className="zenith-card">
                                    <h4 className="m-0 display-font mb-6" style={{ fontSize: '16px' }}>Compliance Protocol</h4>
                                    <div className="protocol-list">
                                        <div className="protocol-item">
                                            <ShieldCheck size={14} className="text-primary" />
                                            <span>Identity Verification Mandatory</span>
                                        </div>
                                        <div className="protocol-item">
                                            <Zap size={14} className="text-accent" />
                                            <span>SLA: 24h Threshold Active</span>
                                        </div>
                                    </div>
                                </div>

                                {!isNewAdmission && fileData && (
                                    <div className="zenith-card">
                                        <h4 className="m-0 display-font mb-6" style={{ fontSize: '16px' }}>Identity Snapshot</h4>
                                        <div className="d-flex flex-column gap-4">
                                            <div className="detail-row">
                                                <span className="text-dim">PATIENT</span>
                                                <span className="text-main fw-700">{fileData.patient_name}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="text-dim">IDENTIFIER</span>
                                                <span className="text-main fw-700">{fileData.cnic}</span>
                                            </div>
                                            <button className="btn-secondary-zenith mt-4" onClick={() => setShowHistory(true)}>
                                                <History size={14} /> VIEW AUDIT TRAIL
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageTransition>

            {showHistory && <SectionHistory visitNumber={fileData?.visit_number} onClose={() => setShowHistory(false)} />}

            <style>{`
                .workspace-toggle {
                    background: rgba(255,255,255,0.05); padding: 4px; border-radius: 99px; display: flex; gap: 4px;
                }
                .workspace-toggle button {
                    background: transparent; border: none; padding: 8px 20px; border-radius: 99px;
                    color: var(--text-dim); font-size: 11px; font-weight: 800; transition: var(--transition-smooth);
                    display: flex; align-items: center; gap: 8px;
                }
                .workspace-toggle button.active { background: var(--primary); color: white; }
                
                .search-box-large {
                    background: rgba(255,255,255,0.03); border: 2px solid var(--border-light);
                    border-radius: 20px; padding: 20px 32px; display: flex; align-items: center; gap: 20px;
                    max-width: 600px; margin: 0 auto; transition: var(--transition-smooth);
                }
                .search-box-large:focus-within { border-color: var(--primary); background: rgba(255,255,255,0.06); }
                .search-box-large input { background: transparent; border: none; outline: none; color: var(--text-main); font-size: 18px; font-weight: 600; width: 100%; }
                
                .zenith-input {
                    background: var(--bg-main); border: 1px solid var(--border-light);
                    border-radius: 12px; padding: 16px; color: var(--text-main); outline: none; transition: var(--transition-smooth);
                }
                .zenith-input:focus { border-color: var(--primary); background: var(--bg-surface); }
                
                .protocol-item {
                    display: flex; align-items: center; gap: 12px; padding: 12px;
                    background: rgba(255,255,255,0.03); border-radius: 10px; margin-bottom: 8px;
                    font-size: 12px; font-weight: 600; color: var(--text-muted);
                }
                .detail-row { display: flex; justify-content: space-between; font-size: 12px; }
            `}</style>
        </Layout>
    );
}
