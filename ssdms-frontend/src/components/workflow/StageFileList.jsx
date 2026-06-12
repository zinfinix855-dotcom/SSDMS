import { useState, useEffect, useCallback } from 'react';
import API from '../../api/axios';
import { 
    Calendar, User, Hash, ArrowRight, AlertCircle, 
    CheckCircle2, RefreshCw, ChevronLeft, ChevronRight, 
    Clock, MoreVertical 
} from 'lucide-react';

const SLA_STATUS = {
    Normal:   { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', label: 'OPTIMAL' },
    Warning:  { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', label: 'DEGRADED' },
    Urgent:   { bg: 'rgba(234, 88, 12, 0.1)', text: '#ea580c', label: 'CRITICAL' },
    Violated: { bg: 'rgba(244, 63, 94, 0.1)', text: '#f43f5e', label: 'BREACH' },
};

const PAGE_SIZE = 12;

export default function StageFileList({ stageName, onSelectFile }) {
    const [files, setFiles]         = useState([]);
    const [total, setTotal]         = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage]           = useState(1);
    const [loading, setLoading]     = useState(true);

    const load = useCallback(async (targetPage = 1) => {
        setLoading(true);
        try {
            const res = await API.get('/files', {
                params: { stage: stageName, page: targetPage, limit: PAGE_SIZE }
            });
            // The new BaseController standardized response: { status, message, data: { files, meta: { total, ... } } }
            // Wait, my BaseController.searchFiles sent { status, data: files, meta: { total, page, limit } }
            setFiles(res.data || []);
            setTotal(res.meta?.total || 0);
            setTotalPages(Math.ceil((res.meta?.total || 0) / PAGE_SIZE));
            setPage(targetPage);
        } catch (err) {
            console.error('Queue load failed', err);
        } finally {
            setLoading(false);
        }
    }, [stageName]);

    useEffect(() => { load(1); }, [load]);

    return (
        <div className="zenith-card p-0 overflow-hidden">
            <div className="p-6 border-bottom border-light bg-card d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-4">
                    <div className="icon-badge-sm">
                        <Hash size={18} />
                    </div>
                    <div>
                        <h4 className="m-0 text-main" style={{ fontSize: '16px' }}>Section Queue</h4>
                        <p className="m-0 text-dim extra-small fw-700">{total} RECORDS PENDING ACTION</p>
                    </div>
                </div>
                <button className="btn-secondary-zenith py-2 px-4" onClick={() => load(page)} disabled={loading}>
                    <RefreshCw size={14} className={loading ? 'spin' : ''} /> REFRESH
                </button>
            </div>

            <div className="table-responsive">
                <table className="zenith-table">
                    <thead>
                        <tr>
                            <th>IDENTIFIER</th>
                            <th>PATIENT CONTEXT</th>
                            <th>REGISTRY DATE</th>
                            <th>PRIORITY</th>
                            <th>SLA STATUS</th>
                            <th className="text-end">ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <TableSkeleton />
                        ) : files.length === 0 ? (
                            <EmptyQueue stageName={stageName} />
                        ) : files.map(file => (
                            <tr key={file.visit_number} onClick={() => onSelectFile(file.visit_number)}>
                                <td>
                                    <span className="fw-800 text-primary">{file.visit_number}</span>
                                    <p className="m-0 text-dim extra-small">MR: {file.mr_number || 'N/A'}</p>
                                </td>
                                <td>
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="avatar-sm">{file.patient_name?.charAt(0)}</div>
                                        <div>
                                            <p className="m-0 fw-700 text-main" style={{ fontSize: '13px' }}>{file.patient_name}</p>
                                            <p className="m-0 text-dim extra-small">{file.cnic}</p>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="d-flex align-items-center gap-2 text-muted">
                                        <Clock size={12} />
                                        <span className="extra-small fw-600">{new Date(file.created_at).toLocaleDateString()}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="priority-tag" style={{ color: getPriorityColor(file.priority_score) }}>
                                        <div className="priority-dot" style={{ background: getPriorityColor(file.priority_score) }} />
                                        {file.priority_score?.toFixed(1) || '0.0'}
                                    </div>
                                </td>
                                <td>
                                    <SlaBadge file={file} />
                                </td>
                                <td className="text-end">
                                    <button className="btn-icon-subtle"><ArrowRight size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="p-6 border-top border-light d-flex justify-content-between align-items-center">
                    <span className="extra-small text-dim fw-700">PAGE {page} OF {totalPages}</span>
                    <div className="d-flex gap-2">
                        <button className="btn-pagination" onClick={() => load(page - 1)} disabled={page <= 1}>
                            <ChevronLeft size={16} />
                        </button>
                        <button className="btn-pagination" onClick={() => load(page + 1)} disabled={page >= totalPages}>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                .zenith-table { width: 100%; border-collapse: collapse; }
                .zenith-table th { 
                    padding: 16px 24px; text-align: left; font-size: 10px; font-weight: 800; 
                    color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.1em;
                    background: rgba(255,255,255,0.01); border-bottom: 1px solid var(--border-light);
                }
                .zenith-table td { padding: 16px 24px; border-bottom: 1px solid var(--border-light); vertical-align: middle; }
                .zenith-table tr { cursor: pointer; transition: var(--transition-smooth); }
                .zenith-table tr:hover { background: rgba(255,255,255,0.03); }
                
                .avatar-sm { 
                    width: 32px; height: 32px; border-radius: 8px; background: var(--bg-surface);
                    display: flex; align-items: center; justify-content: center; font-weight: 800;
                    font-size: 12px; color: var(--primary); border: 1px solid var(--border-light);
                }
                .priority-tag { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 800; }
                .priority-dot { width: 6px; height: 6px; border-radius: 50%; }
                
                .btn-pagination {
                    background: rgba(255,255,255,0.05); border: 1px solid var(--border-light);
                    color: white; width: 36px; height: 36px; border-radius: 10px;
                    display: flex; align-items: center; justify-content: center; transition: var(--transition-smooth);
                }
                .btn-pagination:hover:not(:disabled) { border-color: var(--primary); background: rgba(255,255,255,0.1); }
                .btn-pagination:disabled { opacity: 0.3; cursor: not-allowed; }
                
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

function SlaBadge({ file }) {
    const status = getSlaStatus(file);
    const meta = SLA_STATUS[status] || SLA_STATUS.Normal;
    return (
        <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill" 
             style={{ background: meta.bg, color: meta.text, border: `1px solid ${meta.text}33` }}>
            <div className="status-dot" style={{ background: meta.text }} />
            <span className="extra-small fw-800">{meta.label}</span>
        </div>
    );
}

function getSlaStatus(file) {
    const now = new Date();
    const deadline = file.deadline_at ? new Date(file.deadline_at) : null;
    if (!deadline) return 'Normal';
    if (now > deadline) return 'Violated';
    const diff = (deadline - now) / 3600000;
    if (diff < 6) return 'Urgent';
    if (diff < 12) return 'Warning';
    return 'Normal';
}

function getPriorityColor(score) {
    if (score >= 15) return '#f43f5e';
    if (score >= 10) return '#f59e0b';
    if (score >= 5)  return '#3b82f6';
    return '#94a3b8';
}

function TableSkeleton() {
    return (
        <>
            {[1, 2, 3, 4].map(i => (
                <tr key={i}>
                    <td colSpan="6" className="py-8"><div className="animate-pulse bg-card rounded-3 h-8 w-full" /></td>
                </tr>
            ))}
        </>
    );
}

function EmptyQueue({ stageName }) {
    return (
        <tr>
            <td colSpan="6" className="p-20 text-center">
                <div className="icon-badge mx-auto mb-6">
                    <CheckCircle2 size={32} className="text-accent" />
                </div>
                <h3 className="m-0 display-font mb-2">Queue Clear</h3>
                <p className="text-dim extra-small fw-700">NO ACTIVE WORKFLOWS PENDING AT {stageName.toUpperCase()}</p>
            </td>
        </tr>
    );
}
