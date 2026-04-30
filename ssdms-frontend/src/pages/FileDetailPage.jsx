import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StageProgress from '../components/StageProgress';
import FileService from '../services/FileService';
import API from '../api/axios';
import {
    User, Fingerprint, Hospital, Calendar, Clock,
    ArrowRight, ChevronRight, ClipboardList, History as HistoryIcon,
    AlertCircle, CheckCircle2, MessageSquare, Send, FileText,
    Download, Paperclip, BookOpen, X, ShieldCheck, Briefcase,
    Activity, ArrowLeft, Banknote, Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageSkeleton } from '../components/common/Skeleton';

// Modular Sub-components
import PatientIdentityCard from '../components/file/PatientIdentityCard';
import MovementLedger from '../components/file/MovementLedger';
import FinancialDistribution from '../components/file/FinancialDistribution';
import SupportiveEvidence from '../components/file/SupportiveEvidence';
import AuditThread from '../components/file/AuditThread';

const STATUS_CLASS = {
    'In Progress': 'status-in-progress',
    'Completed': 'status-completed',
    'Objected': 'status-objected',
    'Returned': 'status-returned',
};

export default function FileDetailPage() {
    const { visitNumber } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showSectionsPanel, setShowSectionsPanel] = useState(false);

    useEffect(() => {
        setLoading(true);
        FileService.getDetail(visitNumber)
            .then(resData => {
                setData(resData);
                setComments(resData.comments || []);
                setAttachments(resData.attachments || []);
            })
            .catch(err => {
                console.error(err);
                toast.error('Failed to load file details');
            })
            .finally(() => setLoading(false));
    }, [visitNumber]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setSubmitting(true);
        try {
            // We can move this to a CommentService later
            const res = await API.post(`/comments/${visitNumber}/comments`, { comment: newComment });
            setComments(prev => [res.data.comment, ...prev]);
            setNewComment('');
            toast.success('Comment added');
        } catch {
            toast.error('Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <Layout title="File Detail">
            <PageSkeleton />
        </Layout>
    );

    if (!data?.file) return (
        <Layout title="File Detail">
            <div className="alert alert-danger rounded-4">
                <AlertCircle size={18} className="me-2" />File not found.
            </div>
        </Layout>
    );

    const { file, history, sections, splits } = data;

    return (
        <Layout title={`File Profile: ${file.visit_number}`}>
            <div className="animate-fade-in">

                {/* ── Premium File Hero ── */}
                <div className="stage-hero mb-4 shadow-sm" style={{ padding: '1.5rem 2rem' }}>
                    <div className="stage-hero-orb" style={{ top: '-40px', right: '-40px' }} />
                    <div className="stage-hero-orb" style={{ bottom: '-80px', left: '-80px', width: '160px', height: '160px', background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)' }} />
                    
                    <div className="position-relative z-index-1">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <button className="btn btn-sm px-2 rounded-pill d-flex align-items-center gap-1 fw-700" 
                                    style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', fontSize: '10px' }}
                                    onClick={() => navigate(-1)}>
                                <ArrowLeft size={12} /> BACK
                            </button>
                            <span className="badge rounded-pill px-2 py-1 fw-800" style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.2)', fontSize: '8px', letterSpacing: '0.5px' }}>
                                CORE FILE PROFILE
                            </span>
                        </div>
                        <div className="row align-items-center">
                            <div className="col-lg-8">
                                <h1 className="fw-900 mb-1 tracking-tighter text-white" style={{ fontSize: '1.75rem' }}>Visit ID: {file.visit_number}</h1>
                                <div className="d-flex align-items-center gap-2 opacity-75 text-white fw-500 extra-small">
                                    <span className="d-flex align-items-center gap-1"><User size={12} /> {file.patient_name}</span>
                                    <span className="opacity-25">|</span>
                                    <span className="d-flex align-items-center gap-1"><Fingerprint size={12} /> {file.cnic}</span>
                                    <span className="opacity-25">|</span>
                                    <span className="d-flex align-items-center gap-1"><Hash size={12} /> MR NO: {file.mr_number || '—'}</span>
                                </div>
                            </div>
                            <div className="col-lg-4 d-flex justify-content-lg-end mt-3 mt-lg-0 gap-2">
                                {sections && sections.length > 0 && (
                                    <button
                                        className="btn btn-sm rounded-pill px-3 py-2 d-flex align-items-center gap-2 shadow-sm fw-800 bg-white text-primary"
                                        onClick={() => setShowSectionsPanel(true)}
                                        style={{ fontSize: '11px', border: 'none' }}
                                    >
                                        <BookOpen size={16} />
                                        <span>ARCHIVE ACCESS</span>
                                        <span className="badge bg-primary rounded-pill px-2" style={{ fontSize: 9 }}>{sections.length}</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Trajectory Card ── */}
                <div className="glass-card mb-4 border-0 shadow-sm overflow-hidden position-relative bg-white">
                    <div className="p-3 bg-primary bg-opacity-5 border-bottom d-flex align-items-center gap-2">
                        <div className="p-1.5 rounded bg-primary text-white shadow-sm">
                            <Activity size={16} />
                        </div>
                        <h6 className="fw-900 mb-0" style={{ fontSize: 13 }}>Operational Workflow Trajectory</h6>
                        <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary px-3 py-1 fw-800 border border-primary border-opacity-10 ms-auto" style={{ fontSize: 9 }}>
                            LIVE STATUS: {file.status?.toUpperCase()}
                        </span>
                    </div>
                    <div className="p-4">
                        <StageProgress currentStage={file.current_stage} />
                    </div>
                </div>

                {/* ── Smart Narrative Summary (Phase 6 AI) ── */}
                {data.narrative && (
                    <div className="glass-card mb-4 border-0 shadow-sm overflow-hidden position-relative"
                         style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderLeft: '4px solid #6366f1' }}>
                        <div className="p-3 d-flex align-items-center gap-2">
                            <Sparkles className="text-primary" size={18} />
                            <h6 className="fw-800 mb-0 text-slate-800" style={{ fontSize: 13, letterSpacing: '0.5px' }}>INTELLIGENT FILE BIOGRAPHY</h6>
                            <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary px-2 py-0.5 ms-auto fw-700" style={{ fontSize: 8 }}>AI GENERATED</span>
                        </div>
                        <div className="px-4 pb-4">
                            <p className="mb-0 text-slate-600 fw-600 leading-relaxed italic" style={{ fontSize: '12.5px', borderLeft: '2px solid #e2e8f0', paddingLeft: '1rem' }}>
                                "{data.narrative}"
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Patient & Movement Row ── */}
                <div className="row g-4 mb-4">
                    <div className="col-lg-4">
                        <PatientIdentityCard file={file} />
                    </div>
                    <div className="col-lg-8">
                        <MovementLedger history={history} />
                    </div>
                </div>

                {/* ── Financial Distribution ── */}
                <FinancialDistribution splits={splits} />

                {/* ── Collaborative Hub & Attachments ── */}
                <div className="row g-4">
                    <div className="col-lg-7">
                        <AuditThread 
                            comments={comments}
                            newComment={newComment}
                            setNewComment={setNewComment}
                            handleAddComment={handleAddComment}
                            submitting={submitting}
                        />
                    </div>
                    <div className="col-lg-5">
                        <SupportiveEvidence attachments={attachments} />
                    </div>
                </div>

            </div>

            {/* Historical Sections Offcanvas */}
            {showSectionsPanel && (
                <div className="sections-offcanvas-overlay" onClick={() => setShowSectionsPanel(false)}>
                    <div className="sections-offcanvas-panel shadow-lg animate-slide-in-right" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-bottom d-flex align-items-center justify-content-between bg-white sticky-top">
                            <div>
                                <h5 className="mb-0 fw-800">Departmental Audit Archive</h5>
                                <p className="extra-small text-muted mb-0 fw-700 text-uppercase tracking-wider">Cumulative Evidence Repository</p>
                            </div>
                            <button className="btn btn-light rounded-circle p-2" onClick={() => setShowSectionsPanel(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 overflow-auto">
                            {sections.length === 0 ? (
                                <p className="text-center text-muted py-5">No archive data available.</p>
                            ) : (
                                <div className="d-flex flex-column gap-4 pb-5">
                                    {sections.map((sec, i) => {
                                        const sectionData = typeof sec.data === 'string' ? JSON.parse(sec.data) : (sec.data || {});
                                        return (
                                            <div key={i} className="glass-card p-4 border shadow-sm">
                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="p-2 rounded bg-primary-light text-primary">
                                                            <ShieldCheck size={16} />
                                                        </div>
                                                        <h6 className="fw-800 text-primary mb-0">{sec.stage_name}</h6>
                                                    </div>
                                                    <span className="extra-small text-muted fw-700">{new Date(sec.created_at).toLocaleDateString()}</span>
                                                </div>

                                                {sec.stage_name === 'Finance' && sectionData.splits ? (
                                                    <div className="bg-light p-3 rounded-4">
                                                        <div className="extra-small fw-800 text-muted mb-2">ALLOCATION RECORDS</div>
                                                        {sectionData.splits.map((s, idx) => (
                                                            <div key={idx} className="d-flex justify-content-between py-1 border-bottom border-white">
                                                                <span className="small fw-700">{s.doctor_name}</span>
                                                                <span className="small fw-800 text-primary">Rs. {Number(s.amount).toLocaleString()}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : sec.stage_name === 'Segregation' && sectionData.category ? (
                                                    <div className="bg-primary bg-opacity-5 p-3 rounded-4 text-center">
                                                        <div className="extra-small fw-800 text-muted mb-1">CLASSIFIED AS</div>
                                                        <div className="h5 fw-800 text-primary mb-0">{sectionData.category.toUpperCase()}</div>
                                                    </div>
                                                ) : (
                                                    <div className="row g-3">
                                                        {Object.entries(sectionData).map(([k, v]) => (
                                                            <div className="col-12" key={k}>
                                                                <div className="extra-small text-muted text-uppercase fw-bold mb-1">{k.replace(/_/g, ' ')}</div>
                                                                <div className="small fw-700 py-2 px-3 bg-light rounded-3 border-0">{String(v)}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="mt-3 pt-3 border-top extra-small text-muted d-flex align-items-center gap-2">
                                                    <User size={12} /> Entered by: <span className="fw-700 text-dark">{sec.entered_by_name || 'System'}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
